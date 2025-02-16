import { DataSource, In, LessThanOrEqual, MoreThanOrEqual, Repository } from "typeorm";
import { SharedEventGroup } from "../../models/sharedEventGroup.entity.js";
import { SharedGroupInvite, InviteStatus } from "../../models/sharedGroupInvite.entity.js";
import { CalendarEvent } from "../../models/calendarEvent.entity.js";
import { NotificationService } from "../notification/index.js";
import { NotificationType } from "../../models/notification.entity.js";
import { User } from "../../models/user.entity.js";
import { Session } from "../../models/session.entity.js";

const CMU_EMAIL_DOMAIN = '@cmu.ac.th';

export interface ISharedCalendarService {
    createSharedGroup(params: {
        ownerId: number,
        title: string,
        color: string,
        priority: number,
        idealDays: string[],
        idealTimeRanges: { start: string, end: string }[],
        memberEmails: string[]
    }): Promise<SharedEventGroup>;

    addMembers(
        groupId: number,
        ownerId: number,
        emails: string[]
    ): Promise<void>;

    removeMembers(
        groupId: number,
        ownerId: number,
        memberIds: number[]
    ): Promise<void>;

    handleInvite(
        inviteToken: string,
        action: 'accept' | 'reject',
        userId: number
    ): Promise<boolean>;

    getGroupInvites(email: string): Promise<{
        group: SharedEventGroup,
        inviteToken: string,
        status: string
    }[]>;

    getGroupMembers(groupId: number, userId: number): Promise<any[]>;

    findOptimalMeetingTime(
        groupId: number,
        duration: number
    ): Promise<Date | null>;

    scheduleGroupMeeting(
        groupId: number,
        ownerId: number,
        title: string,
        startTime: Date,
        duration: number
    ): Promise<CalendarEvent>;
}

export class SharedCalendarService implements ISharedCalendarService {
    private _sharedGroup: Repository<SharedEventGroup>;
    private _invite: Repository<SharedGroupInvite>;
    private _event: Repository<CalendarEvent>;
    private _user: Repository<User>;
    private _session: Repository<Session>;
    private _notificationService: NotificationService;

    constructor(dataSource: DataSource) {
        this._sharedGroup = dataSource.getRepository(SharedEventGroup);
        this._invite = dataSource.getRepository(SharedGroupInvite);
        this._event = dataSource.getRepository(CalendarEvent);
        this._user = dataSource.getRepository(User);
        this._session = dataSource.getRepository(Session);
        this._notificationService = new NotificationService(dataSource);
    }

    private formatCMUEmail(username: string): string {
        return `${username}${CMU_EMAIL_DOMAIN}`;
    }

    private async notifyUser(email: string, notification: {
        userId?: number,
        type: NotificationType,
        data: any
    }): Promise<void> {
        const session = await this._session
            .createQueryBuilder("session")
            .leftJoinAndSelect("session.owner", "owner")
            .where("session.CMUUsername = :username", { username: email.replace(CMU_EMAIL_DOMAIN, '') })
            .getOne();

        if (session?.owner)
            await this._notificationService.createNotification({
                userId: session.owner.id,
                type: notification.type,
                data: notification.data
            });
        else
            console.log(`Send email to ${this.formatCMUEmail(email)}:`, notification);
    }

    async createSharedGroup(params: {
        ownerId: number,
        title: string,
        color: string,
        priority: number,
        idealDays: string[],
        idealTimeRanges: { start: string, end: string }[],
        memberEmails: string[]
    }): Promise<SharedEventGroup> {
        const owner = await this._user.findOneBy({ id: params.ownerId });
        if (!owner) throw new Error('Owner not found');

        const group = this._sharedGroup.create({
            owner,
            title: params.title,
            color: params.color,
            priority: params.priority,
            idealDays: params.idealDays,
            idealTimeRanges: params.idealTimeRanges,
            members: [owner]
        });

        const savedGroup = await this._sharedGroup.save(group);

        await Promise.all(params.memberEmails.map(async (email) => {
            const formattedEmail = this.formatCMUEmail(email);
            const invite = this._invite.create({
                group: savedGroup,
                email: formattedEmail,
                status: InviteStatus.PENDING
            });
            const savedInvite = await this._invite.save(invite);

            await this.notifyUser(formattedEmail, {
                type: NotificationType.GROUP_INVITE,
                data: {
                    groupId: savedGroup.id,
                    groupName: savedGroup.title,
                    inviteToken: savedInvite.token
                }
            });
        }));

        return savedGroup;
    }

    async addMembers(groupId: number, ownerId: number, emails: string[]): Promise<void> {
        const group = await this._sharedGroup.findOne({
            where: { id: groupId, owner: { id: ownerId } },
            relations: ['members']
        });

        if (!group)
            throw new Error('Group not found or unauthorized');

        await Promise.all(emails.map(async (email) => {
            const formattedEmail = this.formatCMUEmail(email);
            const invite = this._invite.create({
                group,
                email: formattedEmail,
                status: InviteStatus.PENDING
            });
            const savedInvite = await this._invite.save(invite);

            await this.notifyUser(formattedEmail, {
                type: NotificationType.GROUP_INVITE,
                data: {
                    groupId: group.id,
                    groupName: group.title,
                    inviteToken: savedInvite.token
                }
            });
        }));
    }

    async removeMembers(groupId: number, ownerId: number, memberIds: number[]): Promise<void> {
        const group = await this._sharedGroup.findOne({
            where: { id: groupId, owner: { id: ownerId } },
            relations: ['members']
        });

        if (!group)
            throw new Error('Group not found or unauthorized');

        const removedMembers = await this._user.findBy({
            id: In(memberIds),
            session: {}
        });

        group.members = group.members.filter(member => !memberIds.includes(member.id));
        await this._sharedGroup.save(group);

        await Promise.all(removedMembers.map(async (member) => {
            if (member.session?.CMUUsername) {
                const formattedEmail = this.formatCMUEmail(member.session.CMUUsername);
                await this.notifyUser(formattedEmail, {
                    type: NotificationType.MEMBER_REMOVED,
                    data: {
                        groupId: group.id,
                        groupName: group.title
                    }
                });
            }
        }));
    }

    async handleInvite(inviteToken: string, action: 'accept' | 'reject', userId: number): Promise<boolean> {
        const invite = await this._invite.findOne({
            where: { token: inviteToken },
            relations: ['group', 'group.owner', 'group.members']
        });

        if (!invite)
            throw new Error('Invite not found');

        invite.status = action === 'accept' ? InviteStatus.ACCEPTED : InviteStatus.REJECTED;
        await this._invite.save(invite);

        const ownerSession = await this._session.findOne({
            where: { owner: { id: invite.group.owner.id } }
        });

        if (action === 'accept') {
            const user = await this._user.findOneBy({ id: userId });
            if (!user) throw new Error('User not found');

            invite.group.members.push(user);
            await this._sharedGroup.save(invite.group);

            if (ownerSession) {
                const formattedEmail = this.formatCMUEmail(ownerSession.CMUUsername);
                await this.notifyUser(formattedEmail, {
                    type: NotificationType.INVITE_ACCEPTED,
                    data: {
                        groupId: invite.group.id,
                        groupName: invite.group.title,
                        memberEmail: invite.email
                    }
                });
            }
        } else if (ownerSession) {
            const formattedEmail = this.formatCMUEmail(ownerSession.CMUUsername);
            await this.notifyUser(formattedEmail, {
                type: NotificationType.INVITE_REJECTED,
                data: {
                    groupId: invite.group.id,
                    groupName: invite.group.title,
                    memberEmail: invite.email
                }
            });
        }

        return true;
    }

    async getGroupInvites(email: string): Promise<{
        group: SharedEventGroup,
        inviteToken: string,
        status: string
    }[]> {
        const formattedEmail = this.formatCMUEmail(email);
        const invites = await this._invite.find({
            where: { email: formattedEmail },
            relations: ['group']
        });

        return invites.map(invite => ({
            group: invite.group,
            inviteToken: invite.token,
            status: invite.status
        }));
    }

    async getGroupMembers(groupId: number, userId: number): Promise<any[]> {
        const group = await this._sharedGroup.findOne({
            where: [
                { id: groupId, owner: { id: userId } },
                { id: groupId, members: { id: userId } }
            ],
            relations: ['members', 'members.session']
        });

        if (!group)
            throw new Error('Group not found or unauthorized');

        return group.members.map(member => ({
            id: member.id,
            name: `${member.givenName} ${member.familyName}`,
            email: member.session?.CMUUsername ? 
                this.formatCMUEmail(member.session.CMUUsername) : undefined
        }));
    }

    async findOptimalMeetingTime(groupId: number, duration: number): Promise<Date | null> {
        const group = await this._sharedGroup.findOne({
            where: { id: groupId },
            relations: ['members']
        });

        if (!group)
            throw new Error('Group not found');

        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

        const memberEvents = await Promise.all(
            group.members.map(member =>
                this._event.find({
                    where: {
                        owner: { id: member.id },
                        start: MoreThanOrEqual(new Date()),
                        end: LessThanOrEqual(oneWeekFromNow)
                    }
                })
            )
        );

        const allEvents = memberEvents.flat();
        const availableSlots = this.findAvailableTimeSlots(
            allEvents,
            duration,
            group.idealDays,
            group.idealTimeRanges
        );

        return availableSlots.length > 0 ? availableSlots[0] : null; // get first match
    }

    private findAvailableTimeSlots(
        events: CalendarEvent[],
        duration: number,
        idealDays: string[],
        idealTimeRanges: { start: string, end: string }[]
    ): Date[] {
        const availableSlots: Date[] = [];
        const now = new Date();
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const durationMs = duration * 60000;

        for (let date = now; date <= oneWeekFromNow; date.setDate(date.getDate() + 1)) {
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            
            if (idealDays.includes(dayName))
                for (const range of idealTimeRanges) {
                    const [startHour, startMinute] = range.start.split(':').map(Number);
                    const [endHour, endMinute] = range.end.split(':').map(Number);
                    
                    const rangeStart = new Date(date);
                    rangeStart.setHours(startHour, startMinute, 0, 0);
                    
                    const rangeEnd = new Date(date);
                    rangeEnd.setHours(endHour, endMinute, 0, 0);

                    const rangeEndTime = rangeEnd.getTime();
                    
                    for (let time = rangeStart.getTime(); time + durationMs <= rangeEndTime; time += 30 * 60000) {
                        const slotStart = new Date(time);
                        const slotEnd = new Date(time + durationMs);
                        
                        const hasConflict = events.some(event => 
                            (slotStart >= event.start && slotStart < event.end) ||
                            (slotEnd > event.start && slotEnd <= event.end) ||
                            (slotStart <= event.start && slotEnd >= event.end)
                        );
                        
                        if (!hasConflict)
                            availableSlots.push(slotStart);
                    }
                }
        }

        return availableSlots;
    }

    async scheduleGroupMeeting(
        groupId: number,
        ownerId: number,
        title: string,
        startTime: Date,
        duration: number
    ): Promise<CalendarEvent> {
        const group = await this._sharedGroup.findOne({
            where: { id: groupId },
            relations: ['members', 'members.session']
        });

        if (!group)
            throw new Error('Group not found');

        const endTime = new Date(startTime.getTime() + duration * 60000);

        const event = this._event.create({
            title,
            start: startTime,
            end: endTime,
            owner: { id: ownerId }
        });

        const savedEvent = await this._event.save(event);

        group.events = [...(group.events || []), savedEvent];
        await this._sharedGroup.save(group);

        await Promise.all(group.members.map(async (member) => {
            if (member.session?.CMUUsername) {
                const formattedEmail = this.formatCMUEmail(member.session.CMUUsername);
                await this.notifyUser(formattedEmail, {
                    type: NotificationType.MEETING_SCHEDULED,
                    data: {
                        groupId: group.id,
                        groupName: group.title,
                        meetingId: savedEvent.id,
                        meetingTime: startTime.toISOString()
                    }
                });
            }
        }));

        return savedEvent;
    }
}

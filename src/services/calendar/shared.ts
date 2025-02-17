import { DataSource, LessThanOrEqual, MoreThanOrEqual, Not, Repository } from "typeorm";
import { SharedEvent, SharedEventStatus } from "../../models/sharedEvent.entity.js";
import { SharedEventInvite, InviteStatus } from "../../models/sharedEventInvite.entity.js";
import { CalendarEvent } from "../../models/calendarEvent.entity.js";
import { NotificationService } from "../notification/index.js";
import { NotificationType } from "../../models/notification.entity.js";
import { NotificationDeliveryType } from "../notification/types.js";
import { User } from "../../models/user.entity.js";
import { transformSharedEventResp, SharedEventResp } from "../../helpers/transform.js";

const CMU_EMAIL_DOMAIN = "@cmu.ac.th";

export interface SharedEventsWithPagination {
    sharedEvents: SharedEventResp[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

export interface ISharedCalendarService {
    getSharedEvents(userId: number, params: {
        status?: InviteStatus;
        limit?: number;
        offset?: number;
    }): Promise<SharedEventsWithPagination>;
    createSharedEvent(params: {
        ownerId: number,
        title: string,
        reminders: number[],
        idealDays: number[],
        idealTimeRange: { start: string, end: string },
        invites: string[],
        duration: number
    }): Promise<SharedEventResp>;
    updateSharedEvent(eventId: number, ownerId: number, params: {
        title?: string,
        reminders?: number[],
        idealDays?: number[],
        idealTimeRange?: { start: string, end: string },
        invites?: string[],
        duration?: number
    }): Promise<SharedEventResp>;
    deleteSharedEvent(eventId: number, ownerId: number): Promise<void>;
    acceptInvite(eventId: number, userId: number): Promise<void>;
    rejectInvite(eventId: number, userId: number): Promise<void>;
    arrangeEvent(eventId: number, ownerId: number): Promise<SharedEventResp>;
    findOptimalMeetingTime(eventId: number): Promise<Date | null>;
    scheduleEventMeeting(eventId: number, ownerId: number, title: string, startTime: Date, duration: number): Promise<CalendarEvent>;
}

export class SharedCalendarService implements ISharedCalendarService {
    private _sharedEvent: Repository<SharedEvent>;
    private _invite: Repository<SharedEventInvite>;
    private _event: Repository<CalendarEvent>;
    private _user: Repository<User>;
    private _notificationService: NotificationService;
    constructor(dataSource: DataSource) {
        this._sharedEvent = dataSource.getRepository(SharedEvent);
        this._invite = dataSource.getRepository(SharedEventInvite);
        this._event = dataSource.getRepository(CalendarEvent);
        this._user = dataSource.getRepository(User);
        this._notificationService = new NotificationService(dataSource);
    }

    async getSharedEvents(userId: number, params: {
        status?: InviteStatus;
        limit?: number;
        offset?: number;
    }): Promise<SharedEventsWithPagination> {
        const user = await this._user.findOneBy({ id: userId });
        if (!user) throw new Error("User not found.");
        const events = await this._sharedEvent.find({
            where: [
                { status: Not(SharedEventStatus.DELETED), owner: { id: userId } }, 
                { status: Not(SharedEventStatus.DELETED), invites: { email: this._formatCMUEmail(user.CMUUsername)} },
            ],
            relations: ["invites", "members", "events", "owner"],
            take: params.limit || 1000,
            skip: params.offset || 0,
            order: { id: "DESC" }
        });
        return {
            sharedEvents: events.map(evnt => transformSharedEventResp(userId, evnt)),
            pagination: {
                total: events.length,
                limit: params.limit || 1000,
                offset: params.offset || 0,
                hasMore: (params.offset || 0) + (params.limit || 1000) < events.length
            }
        };
    }

    private _formatCMUEmail(username: string): string {
        return `${username}${CMU_EMAIL_DOMAIN}`;
    }

    private _formatCMUUsername(email: string): string {
        return email.replace(CMU_EMAIL_DOMAIN, "");
    }

    private async _notifyUser(email: string, notification: {
        userId?: number,
        type: NotificationType,
        data: any,
        scheduledFor?: Date
    }): Promise<void> {
        if (notification.userId) {
            console.log(notification);
            // For registered users:
            // 1. In-app notification
            await this._notificationService.createNotification({
                userId: notification.userId,
                type: notification.type,
                data: notification.data,
                deliveryType: NotificationDeliveryType.IN_APP,
                scheduledFor: notification.scheduledFor
            });

            // 2. Email (registered template)
            await this._notificationService.createNotification({
                userId: notification.userId,
                type: notification.type,
                data: notification.data,
                deliveryType: NotificationDeliveryType.EMAIL_REGISTERED,
                deliveryMetadata: {
                    emailTo: email
                },
                scheduledFor: notification.scheduledFor
            });

            // 3. FCM notification
            const user = await this._user.findOne({ 
                where: { id: notification.userId },
                relations: ["sessions"]
            });
            for (const session of user.sessions) {
                await this._notificationService.createNotification({
                    userId: notification.userId,
                    type: notification.type,
                    data: notification.data,
                    deliveryType: NotificationDeliveryType.FCM,
                    deliveryMetadata: {
                        fcmToken: session.fcmToken
                    },
                    scheduledFor: notification.scheduledFor
                });
            }
        } else {
            // For unregistered users, send email with unregistered template
            await this._notificationService.createNotification({
                type: notification.type,
                data: notification.data,
                deliveryType: NotificationDeliveryType.EMAIL_UNREGISTERED,
                deliveryMetadata: {
                    emailTo: email
                },
                scheduledFor: notification.scheduledFor
            });
        }
    }

    async createSharedEvent(params: {
        ownerId: number,
        title: string,
        reminders: number[],
        idealDays: number[],
        idealTimeRange: { start: string, end: string },
        invites: string[],
        duration: number
    }): Promise<SharedEventResp> {
        const owner = await this._user.findOneBy({ id: params.ownerId });
        if (!owner)
            throw new Error("Owner not found");
        const event = this._sharedEvent.create({
            owner,
            title: params.title,
            reminders: params.reminders,
            idealDays: params.idealDays,
            idealTimeRange: params.idealTimeRange,
            duration: params.duration,
            status: SharedEventStatus.PENDING,
            members: [owner],
            invites: []
        });
        const savedEvent = await this._sharedEvent.save(event);
        await Promise.all(params.invites.map(async (email) => {
            const user = await this._user.findOneBy({ 
                CMUUsername: this._formatCMUUsername(email) 
            });
            const invite = this._invite.create({
                event: savedEvent,
                email: email,
                status: InviteStatus.PENDING
            });
            const savedInvite = await this._invite.save(invite);
            await this._notifyUser(email, {
                type: NotificationType.GROUP_INVITE,
                userId: user?.id,
                data: {
                    eventId: savedEvent.id,
                    eventName: savedEvent.title
                }
            });
            event.invites.push(savedInvite);
        }));
        return transformSharedEventResp(owner.id, savedEvent);
    }

    async updateSharedEvent(eventId: number, ownerId: number, newEventRaw: Partial<{
        title: string,
        reminders: number[],
        idealDays: number[],
        idealTimeRange: { start: string, end: string },
        invites: string[],
        duration: number
    }>): Promise<SharedEventResp> {
        const originalEvent = await this._sharedEvent.findOne({
            where: { id: eventId, owner: { id: ownerId } },
            relations: ["members", "invites", "owner"]
        });
        if (!originalEvent)
            throw new Error("Event not found.");
        if (originalEvent.status === SharedEventStatus.ARRANGED)
            throw new Error("Cannot update an arranged event.");
        if (originalEvent.status === SharedEventStatus.DELETED)
            throw new Error("Event already deleted.");
        const newEvent = { 
            ...originalEvent,
            ...newEventRaw,
            invites: newEventRaw.invites?.map(email => this._invite.create({ email }))
        };
        const notifyEmail = (originalEvent.invites || []) // filter out new email
            .filter(invite => invite.status !== InviteStatus.PENDING) // what to filtered out.
            .map(invite => invite.email)
            .filter(email => !newEventRaw.invites?.includes(email))
        await Promise.all(notifyEmail.map(async (email) => {
            const invite = this._invite.create({
                event: originalEvent,
                email: email,
                status: InviteStatus.PENDING
            });
            await this._invite.save(invite);
            await this._notifyUser(email, {
                type: NotificationType.GROUP_INVITE,
                data: {
                    eventId: originalEvent.id,
                    eventName: originalEvent.title
                }
            });
        }));
        return transformSharedEventResp(ownerId, await this._sharedEvent.save(newEvent));
    }

    async deleteSharedEvent(eventId: number, ownerId: number): Promise<void> {
        const event = await this._sharedEvent.findOne({
            where: {
                id: eventId, 
                status: Not(SharedEventStatus.DELETED),
                owner: { id: ownerId }
            },
            relations: ["owner", "members"]
        });
        if (!event)
            throw new Error("Event not found.");
        event.status = SharedEventStatus.DELETED;
        await Promise.all(event.members.map(async (member) => {
            await this._notifyUser(
                this._formatCMUEmail(member.CMUUsername), 
                {
                    type: NotificationType.EVENT_DELETED,
                    userId: ownerId,
                    data: {
                        eventId: event.id,
                        eventName: event.title
                    }
                }
            );
        }));
        await this._sharedEvent.save(event);
    }

    async acceptInvite(eventId: number, userId: number): Promise<void> {
        const user = await this._user.findOneBy({ id: userId });
        if (!user)
            throw new Error("User not found.");
        const event = await this._sharedEvent.findOne({
            where: { id: eventId },
            relations: ["owner", "members", "invites", "events"]
        });
        if (!event)
            throw new Error("Invite not found.");
        if (event.status === SharedEventStatus.ARRANGED)
            throw new Error("Cannot accept invite for an arranged event.");
        if (event.status === SharedEventStatus.DELETED)
            throw new Error("Event already deleted.");
        const invite = await this._invite.findOneBy({
            event: { id: eventId },
            email: this._formatCMUEmail(user.CMUUsername),
            status: InviteStatus.PENDING
        });
        if (!invite)
            throw new Error("Invite not found.");
        invite.status = InviteStatus.ACCEPTED;
        await this._invite.save(invite);
        event.members.push(user);
        await this._sharedEvent.save(event);
        await this._notifyUser(
            this._formatCMUEmail(event.owner.CMUUsername), 
            {
                type: NotificationType.INVITE_ACCEPTED,
                userId: event.owner.id,
                data: {
                    eventId: event.id,
                    eventName: event.title,
                    memberEmail: invite.email
                }
            }
        );
    }

    async rejectInvite(eventId: number, userId: number): Promise<void> {
        const user = await this._user.findOneBy({ id: userId });
        if (!user) 
            throw new Error("User not found.");
        const event = await this._sharedEvent.findOne({
            where: { id: eventId },
            relations: ["owner"]
        });
        if (!event)
            throw new Error("Invite not found.");
        if (event.status === SharedEventStatus.ARRANGED)
            throw new Error("Cannot reject invite for an arranged event.");
        if (event.status === SharedEventStatus.DELETED)
            throw new Error("Event already deleted.");
        const invite = await this._invite.findOneBy({
            event: { id: eventId },
            email: this._formatCMUEmail(user.CMUUsername),
            status: InviteStatus.PENDING
        });
        if (!invite) 
            throw new Error("Invite not found.");
        invite.status = InviteStatus.REJECTED;
        await this._invite.save(invite);
        await this._notifyUser(
            this._formatCMUEmail(event.owner.CMUUsername), 
            {
                type: NotificationType.INVITE_REJECTED,
                userId: event.owner.id,
                data: {
                    eventId: event.id,
                    eventName: event.title,
                    memberEmail: invite.email
                }
            }
        );
    }

    async arrangeEvent(eventId: number, ownerId: number): Promise<SharedEventResp> {
        const event = await this._sharedEvent.findOne({
            where: { id: eventId, owner: { id: ownerId } },
            relations: ["members", "invites", "events", "owner"]
        });
        if (!event)
            throw new Error("Event not found or unauthorized.");
        if (event.status === SharedEventStatus.ARRANGED)
            throw new Error("Event is already arranged.");
        if (event.status === SharedEventStatus.DELETED)
            throw new Error("Event already deleted.");

        // Remove members who rejected or haven't responded
        const acceptedInvites = event.invites.filter(invite => invite.status === InviteStatus.ACCEPTED);
        event.members = event.members.filter(member => 
            member.id === ownerId || // Keep owner
            acceptedInvites.some(invite => 
                member.CMUUsername && 
                this._formatCMUEmail(member.CMUUsername) === invite.email
            )
        );

        event.status = SharedEventStatus.ARRANGED;
        return transformSharedEventResp(ownerId, await this._sharedEvent.save(event));
    }

    async findOptimalMeetingTime(eventId: number): Promise<Date | null> {
        const event = await this._sharedEvent.findOne({
            where: { id: eventId },
            relations: ["members", "owner"]
        });
        if (!event)
            throw new Error("Event not found");
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

        const memberEvents = await Promise.all(
            event.members.map(member =>
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
            event.duration,
            event.idealDays,
            [event.idealTimeRange] // Wrap in array for compatibility with existing method
        );

        return availableSlots.length > 0 ? availableSlots[0] : null;
    }

    private findAvailableTimeSlots(
        events: CalendarEvent[],
        duration: number,
        idealDays: number[],
        idealTimeRanges: { start: string, end: string }[]
    ): Date[] {
        const availableSlots: Date[] = [];
        const now = new Date();
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const durationMs = duration * 60000;

        for (let date = now; date <= oneWeekFromNow; date.setDate(date.getDate() + 1)) {
            if (idealDays.includes(date.getDay()))
                for (const range of idealTimeRanges) {
                    const [startHour, startMinute] = range.start.split(":").map(Number);
                    const [endHour, endMinute] = range.end.split(":").map(Number);
                    
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

    async scheduleEventMeeting(
        eventId: number,
        ownerId: number,
        title: string,
        startTime: Date,
        duration: number
    ): Promise<CalendarEvent> {
        const event = await this._sharedEvent.findOne({
            where: { id: eventId },
            relations: ["members", "owner"]
        });

        if (!event)
            throw new Error("Event not found.");

        const endTime = new Date(startTime.getTime() + duration * 60000);

        const calendarEvent = this._event.create({
            title,
            start: startTime,
            end: endTime,
            owner: { id: ownerId }
        });

        const savedEvent = await this._event.save(calendarEvent);

        event.events = [...(event.events || []), savedEvent];
        await this._sharedEvent.save(event);

        await Promise.all(event.members.map(async (member) => {
            const formattedEmail = this._formatCMUEmail(member.CMUUsername);
            await this._notifyUser(formattedEmail, {
                type: NotificationType.MEETING_SCHEDULED,
                userId: member.id,
                data: {
                    eventId: event.id,
                    eventName: event.title,
                    meetingId: savedEvent.id,
                    meetingTime: startTime.toISOString()
                }
            });
        }));

        return savedEvent;
    }
}

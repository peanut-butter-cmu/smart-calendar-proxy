import { DataSource, LessThanOrEqual, MoreThanOrEqual, Repository } from "typeorm";
import { SharedEvent } from "../../models/sharedEvent.entity.js";
import { SharedEventInvite, InviteStatus } from "../../models/sharedEventInvite.entity.js";
import { CalendarEvent } from "../../models/calendarEvent.entity.js";
import { NotificationService } from "../notification/index.js";
import { NotificationType } from "../../models/notification.entity.js";
import { NotificationDeliveryType } from "../notification/types.js";
import { User } from "../../models/user.entity.js";

const CMU_EMAIL_DOMAIN = '@cmu.ac.th';

export interface ISharedCalendarService {
    createSharedEvent(params: {
        ownerId: number,
        title: string,
        reminders: number[],
        idealDays: number[],
        idealTimeRange: { start: string, end: string },
        members: string[]
    }): Promise<SharedEvent>;
    updateSharedEvent(eventId: number, ownerId: number, params: {
        title?: string,
        reminders?: number[],
        idealDays?: number[],
        idealTimeRange?: { start: string, end: string },
        members?: string[]
    }): Promise<SharedEvent>;
    deleteSharedEvent(eventId: number, ownerId: number): Promise<void>;
    acceptInvite(eventId: number, userId: number): Promise<SharedEvent>;
    rejectInvite(eventId: number, userId: number): Promise<SharedEvent>;
    arrangeEvent(eventId: number, ownerId: number): Promise<SharedEvent>;
    findOptimalMeetingTime(eventId: number, duration: number): Promise<Date | null>;
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

    private _formatCMUEmail(username: string): string {
        return `${username}${CMU_EMAIL_DOMAIN}`;
    }

    private async _notifyUser(email: string, notification: {
        userId?: number,
        type: NotificationType,
        data: any,
        scheduledFor?: Date
    }): Promise<void> {
        
        if (notification.userId) {
            const user = await this._user.findOneBy({ id: notification.userId });
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
                    emailTo: this._formatCMUEmail(email)
                },
                scheduledFor: notification.scheduledFor
            });

            // 3. FCM notification
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
        } else
            // For unregistered users, send email with unregistered template
            await this._notificationService.createNotification({
                type: notification.type,
                data: notification.data,
                deliveryType: NotificationDeliveryType.EMAIL_UNREGISTERED,
                deliveryMetadata: {
                    emailTo: this._formatCMUEmail(email)
                },
                scheduledFor: notification.scheduledFor
            });
    }

    async createSharedEvent(params: {
        ownerId: number,
        title: string,
        reminders: number[],
        idealDays: number[],
        idealTimeRange: { start: string, end: string },
        members: string[]
    }): Promise<SharedEvent> {
        const owner = await this._user.findOneBy({ id: params.ownerId });
        if (!owner) throw new Error('Owner not found');

        const event = this._sharedEvent.create({
            owner,
            title: params.title,
            reminders: params.reminders,
            idealDays: params.idealDays,
            idealTimeRange: params.idealTimeRange,
            members: [owner]
        });

        const savedEvent = await this._sharedEvent.save(event);

        await Promise.all(params.members.map(async (email) => {
            const formattedEmail = this._formatCMUEmail(email);
            const invite = this._invite.create({
                event: savedEvent,
                email: formattedEmail,
                status: InviteStatus.PENDING
            });
            await this._invite.save(invite);

            await this._notifyUser(formattedEmail, {
                type: NotificationType.GROUP_INVITE,
                data: {
                    eventId: savedEvent.id,
                    eventName: savedEvent.title
                }
            });
        }));

        return savedEvent;
    }

    async updateSharedEvent(eventId: number, ownerId: number, params: {
        title?: string,
        reminders?: number[],
        idealDays?: number[],
        idealTimeRange?: { start: string, end: string },
        memberEmails?: string[]
    }): Promise<SharedEvent> {
        const event = await this._sharedEvent.findOne({
            where: { id: eventId, owner: { id: ownerId } },
            relations: ['members']
        });

        if (!event)
            throw new Error('Event not found or unauthorized');

        if (params.title) event.title = params.title;
        if (params.reminders) event.reminders = params.reminders;
        if (params.idealDays) event.idealDays = params.idealDays;
        if (params.idealTimeRange) event.idealTimeRange = params.idealTimeRange;

        if (params.memberEmails) {
            await Promise.all(params.memberEmails.map(async (email) => {
                const formattedEmail = this._formatCMUEmail(email);
                const invite = this._invite.create({
                    event,
                    email: formattedEmail,
                    status: InviteStatus.PENDING
                });
                await this._invite.save(invite);

                await this._notifyUser(formattedEmail, {
                    type: NotificationType.GROUP_INVITE,
                    data: {
                        eventId: event.id,
                        eventName: event.title
                    }
                });
            }));
        }

        return await this._sharedEvent.save(event);
    }

    async deleteSharedEvent(eventId: number, ownerId: number): Promise<void> {
        const event = await this._sharedEvent.findOne({
            where: { id: eventId, owner: { id: ownerId } },
            relations: ['members', 'members.session']
        });

        if (!event)
            throw new Error('Event not found or unauthorized');

        // Notify members
        await Promise.all(event.members.map(async (member) => {
            const formattedEmail = this._formatCMUEmail(member.CMUUsername);
            await this._notifyUser(formattedEmail, {
                type: NotificationType.EVENT_DELETED,
                data: {
                    eventId: event.id,
                    eventName: event.title
                }
            });
        }));

        await this._sharedEvent.remove(event);
    }

    async acceptInvite(eventId: number, userId: number): Promise<SharedEvent> {
        const user = await this._user.findOne({
            where: { id: userId },
            relations: ['session']
        });
        if (!user) throw new Error('User not found');

        const event = await this._sharedEvent.findOne({
            where: { id: eventId },
            relations: ['owner', 'members']
        });
        if (!event) throw new Error('Event not found');

        const invite = await this._invite.findOne({
            where: {
                event: { id: eventId },
                email: user.CMUUsername ? this._formatCMUEmail(user.CMUUsername) : '',
                status: InviteStatus.PENDING
            }
        });
        if (!invite) throw new Error('Invite not found or already processed');

        invite.status = InviteStatus.ACCEPTED;
        await this._invite.save(invite);

        event.members.push(user);
        const updatedEvent = await this._sharedEvent.save(event);

        // Notify owner
        const owner = await this._user.findOne({
            where: { id: event.owner.id }
        });

        if (owner) {
            const formattedEmail = this._formatCMUEmail(owner.CMUUsername);
            await this._notifyUser(formattedEmail, {
                type: NotificationType.INVITE_ACCEPTED,
                data: {
                    eventId: event.id,
                    eventName: event.title,
                    memberEmail: invite.email
                }
            });
        }

        return updatedEvent;
    }

    async rejectInvite(eventId: number, userId: number): Promise<SharedEvent> {
        const user = await this._user.findOne({
            where: { id: userId },
            relations: ['session']
        });
        if (!user) throw new Error('User not found');

        const event = await this._sharedEvent.findOne({
            where: { id: eventId },
            relations: ['owner']
        });
        if (!event) throw new Error('Event not found');

        const invite = await this._invite.findOne({
            where: {
                event: { id: eventId },
                email: user.CMUUsername ? this._formatCMUEmail(user.CMUUsername) : '',
                status: InviteStatus.PENDING
            }
        });
        if (!invite) throw new Error('Invite not found or already processed');

        invite.status = InviteStatus.REJECTED;
        await this._invite.save(invite);

        // Notify owner
        const formattedEmail = this._formatCMUEmail(user.CMUUsername);
        await this._notifyUser(formattedEmail, {
            type: NotificationType.INVITE_REJECTED,
            data: {
                eventId: event.id,
                eventName: event.title,
                memberEmail: invite.email
            }
        });

        return event;
    }

    async arrangeEvent(eventId: number, ownerId: number): Promise<SharedEvent> {
        const event = await this._sharedEvent.findOne({
            where: { id: eventId, owner: { id: ownerId } },
            relations: ['members', 'invites']
        });

        if (!event)
            throw new Error('Event not found or unauthorized');

        // Remove members who rejected or haven't responded
        const acceptedInvites = event.invites.filter(invite => invite.status === InviteStatus.ACCEPTED);
        event.members = event.members.filter(member => 
            member.id === ownerId || // Keep owner
            acceptedInvites.some(invite => 
                member.CMUUsername && 
                this._formatCMUEmail(member.CMUUsername) === invite.email
            )
        );

        return await this._sharedEvent.save(event);
    }

    async findOptimalMeetingTime(eventId: number, duration: number): Promise<Date | null> {
        const event = await this._sharedEvent.findOne({
            where: { id: eventId },
            relations: ['members']
        });

        if (!event)
            throw new Error('Event not found');

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
            duration,
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

    async scheduleEventMeeting(
        eventId: number,
        ownerId: number,
        title: string,
        startTime: Date,
        duration: number
    ): Promise<CalendarEvent> {
        const event = await this._sharedEvent.findOne({
            where: { id: eventId },
            relations: ['members', 'members.session']
        });

        if (!event)
            throw new Error('Event not found');

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
            if (member.CMUUsername) {
                const formattedEmail = this._formatCMUEmail(member.CMUUsername);
                await this._notifyUser(formattedEmail, {
                    type: NotificationType.MEETING_SCHEDULED,
                    data: {
                        eventId: event.id,
                        eventName: event.title,
                        meetingId: savedEvent.id,
                        meetingTime: startTime.toISOString()
                    }
                });
            }
        }));

        return savedEvent;
    }
}

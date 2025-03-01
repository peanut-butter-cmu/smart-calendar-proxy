import { DataSource, Not, Repository } from "typeorm";
import { SharedEvent } from "../models/sharedEvent.entity.js";
import { CalendarEventType, SharedEventStatus } from "../types/enums.js";
import { SharedEventInvite } from "../models/sharedEventInvite.entity.js";
import { InviteStatus, NotificationType } from "../types/enums.js";
import { NotificationService } from "./notification.service.js";
import { User } from "../models/user.entity.js";
import * as swagger from "../types/swagger.js";
import { fCMUEmail, fSharedEvent } from "../helpers/formatter.js";
import { CalendarEvent } from "../models/calendarEvent.entity.js";
import { findTimeSlotInRange } from "../helpers/calendar.js";
import { CalendarService } from "./calendar.service.js";

export class SharedCalendarService {
    private _shared: Repository<SharedEvent>;
    private _invite: Repository<SharedEventInvite>;
    private _user: Repository<User>;
    private _event: Repository<CalendarEvent>;
    private _notificationService: NotificationService;
    private _calendarService: CalendarService;
    private _ds: DataSource;

    constructor(dataSource: DataSource) {
        this._shared = dataSource.getRepository(SharedEvent);
        this._invite = dataSource.getRepository(SharedEventInvite);
        this._user = dataSource.getRepository(User);
        this._event = dataSource.getRepository(CalendarEvent);
        this._notificationService = new NotificationService(dataSource);
        this._calendarService = new CalendarService(dataSource);
        this._ds = dataSource;
    }

    public async getSharedEventsByOwner(ownerId: number, params: { limit: number, offset: number }): Promise<swagger.Pagination<swagger.SharedEvent>> {
        const user = await this._user.findOneBy({ id: ownerId });
        if (!user) throw new Error("User not found.");
        const [events, total] = await this._shared.findAndCount({
            where: [
                { status: Not(SharedEventStatus.DELETED), owner: { id: ownerId } }, 
                { status: Not(SharedEventStatus.DELETED), invites: { email: fCMUEmail(user.CMUUsername) } },
            ],
            relations: ["invites", "members", "events", "owner"],
            take: params.limit,
            skip: params.offset,
            order: { id: "DESC" }
        });
        return {
            sharedEvents: events.map(fSharedEvent),
            pagination: {
                total,
                limit: params.limit,
                offset: params.offset
            }
        };
    }
    
    public async getSharedEventByID(ownerId: number, eventId: number): Promise<swagger.SharedEvent> {
        const user = await this._user.findOneBy({ id: ownerId });
        if (!user)
            throw new Error("User not found.");
        const event = await this._shared.findOne({
            where: [
                { id: eventId, status: Not(SharedEventStatus.DELETED), owner: { id: ownerId } }, 
                { id: eventId, status: Not(SharedEventStatus.DELETED), invites: { email: fCMUEmail(user.CMUUsername) } },
            ],
            relations: ["invites", "members", "events", "owner"],
            order: { id: "DESC" }
        });
        if (!event)
            throw new Error("Event not found.");
        return fSharedEvent(event);
    }

    async addSharedEvent(ownerId: number, params: {
        title: string;
        reminders: number[];
        idealDays: number[];
        idealTimeRange: { 
            startDate: Date;
            endDate: Date;
            dailyStartMin: number;
            dailyEndMin: number;
        },
        invites: string[];
        duration: number
    }): Promise<swagger.SharedEvent> {
        const user = await this._user.findOneBy({ id: ownerId });
        if (!user)
            throw new Error("User not found.");
        if (params.invites.some(email => fCMUEmail(user.CMUUsername) === email))
            throw new Error("Cannot invite owner into thier own event.");
        const savedEvent = await this._shared.save(
            this._shared.create({
                owner: { id: ownerId },
                title: params.title,
                reminders: params.reminders,
                idealDays: params.idealDays,
                idealTimeRange: params.idealTimeRange,
                duration: params.duration,
                status: SharedEventStatus.PENDING,
                members: [user],
                invites: []
            })
        );
        savedEvent.invites = await this._invite.save(
            this._invite.create(params.invites.map(email => ({
                event: { id: savedEvent.id },
                email
            })
        )));
        await this._notificationService.notifyByEmails(
            params.invites,
            NotificationType.EVENT_CREATED,
            { eventId: savedEvent.id }
        );
        return fSharedEvent(savedEvent);
    }

    async editSharedEventByID(ownerId: number, id: number, params: swagger.SharedEventEdit): Promise<swagger.SharedEvent> {
        console.log([ownerId, id, params]);
        throw new Error("Not implemented");
    }

    async deleteSharedEventByID(ownerId: number, id: number): Promise<void> {
        const event = await this._shared.findOne({
            where: {
                id, 
                status: Not(SharedEventStatus.DELETED),
                owner: { id: ownerId }
            },
            relations: ["members"]
        });
        if (!event) throw new Error("Event not found.");
        await this._shared.save({
            ...event,
            status: SharedEventStatus.DELETED
        });
        await this._notificationService.notifyByEmails(
            event.members.map(member => member.CMUUsername),
            NotificationType.EVENT_DELETED,
            { eventId: event.id }
        )
    }

    async _handleInvite(status: InviteStatus.ACCEPTED | InviteStatus.REJECTED, userId: number, eventId: number) {
        const user = await this._user.findOneBy({ id: userId });
        if (!user)
            throw new Error("User not found.");
        const email = fCMUEmail(user.CMUUsername);
        const event = await this._shared.findOne({
            where: {
                id: eventId, 
                status: SharedEventStatus.PENDING,
                invites: { 
                    email: email,
                    status: InviteStatus.PENDING
                }
            },
            relations: ["owner", "invites", "members"]
        });
        if (!event)
            throw new Error("Invite not found.");
        if (event.owner.id === userId)
            throw new Error(`Cannot get ${status} by your own event.`);
        const invite = event.invites.find(invite => invite.email === email);
        invite.status = status;
        await this._invite.save(invite);
        if (status === InviteStatus.ACCEPTED) {
            event.members.push(user);
            await this._shared.save(event);
        }
        await this._notificationService.notifyByIDs(
            [event.owner.id],
            InviteStatus.ACCEPTED ? NotificationType.INVITE_ACCEPTED : NotificationType.INVITE_REJECTED,
            { email: fCMUEmail(user.CMUUsername) }
        );
    }

    async acceptSharedEventByID(ownerId: number, eventId: number): Promise<void> {
        return this._handleInvite(InviteStatus.ACCEPTED, ownerId, eventId);
    }

    async rejectSharedEventByID(ownerId: number, eventId: number): Promise<void> {
        return this._handleInvite(InviteStatus.REJECTED, ownerId, eventId);
    }

    async arrangeSharedEventByID(ownerId: number, eventId: number): Promise<swagger.SharedEvent> {
        const qr = this._ds.createQueryRunner();
        const man = qr.manager;
        await qr.connect();
        await qr.startTransaction();
        try {
            // Get shared event with members
            const shared = await man.findOne(SharedEvent, {
                where: {
                    id: eventId,
                    status: SharedEventStatus.PENDING,
                    owner: { id: ownerId }
                },
                relations: ["owner", "members", "events"]
            });
            if (!shared)
                throw new Error("Shared event not found.");

            // Get all busy events for all members
            const memberIds = shared.members.map(member => member.id);
            const busyEvents = await man
                .createQueryBuilder(CalendarEvent, "event")
                .leftJoinAndSelect("event.owner", "owner")
                .leftJoinAndSelect("event.groups", "grp")
                .where("owner.id IN (:...memberIds)", { memberIds })
                .andWhere("grp.isBusy = :isBusy", { isBusy: true })
                .andWhere(
                    "(event.start >= :startDate AND event.start <= :endDate) OR " +
                    "(event.end >= :startDate AND event.end <= :endDate) OR " +
                    "(event.start <= :startDate AND event.end >= :endDate)",
                    {
                        startDate: shared.idealTimeRange.startDate,
                        endDate: shared.idealTimeRange.endDate
                    }
                )
                .getMany();

            // Find suitable time slots
            const slots = findTimeSlotInRange({
                ...shared.idealTimeRange,
                duration: shared.duration,
                idealDays: shared.idealDays,
                busyEvents
            });

            // Create calendar events for all members using CalendarService
            const createdEvents = await Promise.all(
                shared.members.flatMap(member => 
                    slots.map(slot => this._calendarService.addEvent(
                        member.id,
                        {
                            title: shared.title,
                            start: slot.start,
                            end: slot.end
                        },
                        { type: CalendarEventType.UNSAVED_SHARED }
                    ))
                )
            );

            shared.events = createdEvents;
            shared.status = SharedEventStatus.ARRANGED;
            const savedShared = await man.save(shared);
            await qr.commitTransaction();
            return fSharedEvent(savedShared);
        } catch(error) {
            await qr.rollbackTransaction();
            throw error;
        } finally {
            await qr.release();
        }
    }

    async saveSharedEventByID(ownerId: number, eventId: number): Promise<swagger.SharedEvent> {
        const event = await this._shared.findOne({
            where: {
                id: eventId,
                status: SharedEventStatus.ARRANGED,
                owner: { id: ownerId }
            },
            relations: ["events", "members", "owner"]
        });
        
        if (!event)
            throw new Error("Arranged shared event not found.");

        event.status = SharedEventStatus.SAVED;
        const savedEvent = await this._shared.save(event);

        // Notify all members
        await this._notificationService.notifyByEmails(
            event.members.map(member => member.CMUUsername),
            NotificationType.MEETING_SCHEDULED,
            { eventId: event.id }
        );

        return fSharedEvent(savedEvent);
    }
}

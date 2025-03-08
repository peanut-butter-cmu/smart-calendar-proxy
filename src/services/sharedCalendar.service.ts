import { DataSource, Equal, Not, Or, Repository } from "typeorm";
import { SharedEvent } from "../models/sharedEvent.entity.js";
import { CalendarEventType, SharedEventStatus } from "../types/enums.js";
import { SharedEventInvite } from "../models/sharedEventInvite.entity.js";
import { InviteStatus, NotificationType } from "../types/enums.js";
import { NotificationService } from "./notification.service.js";
// import { User } from "../models/user.entity.js";
import { CalendarEvent } from "../models/calendarEvent.entity.js";
import { findTimeSlotInRange } from "../helpers/calendar.js";
import { CalendarService } from "./calendar.service.js";
import { UserService } from "./user.service.js";
import { Pagination } from "../types/global.js";

export class SharedCalendarService {
    private _shared: Repository<SharedEvent>;
    private _invite: Repository<SharedEventInvite>;
    private _event: Repository<CalendarEvent>;
    private _notificationService: NotificationService;
    private _calendarService: CalendarService;
    private _userService: UserService;

    constructor(dataSource: DataSource, services: { userService?: UserService, calendarService?: CalendarService, notificationService?: NotificationService } = {}) {
        this._shared = dataSource.getRepository(SharedEvent);
        this._invite = dataSource.getRepository(SharedEventInvite);
        this._event = dataSource.getRepository(CalendarEvent);
        this._notificationService = services.notificationService || new NotificationService(dataSource, { userService: this._userService });
        this._userService = services.userService || new UserService(dataSource);
        this._calendarService = services.calendarService || new CalendarService(dataSource, this._userService);
    }

    public async getSharedEventsByOwner(
        ownerId: number, 
        params: {
            status?: SharedEventStatus, 
            limit: number, 
            offset: number,
            noPagination?: false // for fixing type issue
        } | {
            limit?: number, // for fixing type issue
            offset?: number, // for fixing type issue
            status?: SharedEventStatus,
            noPagination: true
        }
    ): Promise<Pagination<SharedEvent>> {
        const user = await this._userService.getUserById(ownerId);
        const condition = params.status ? Or(Equal(params.status), Not(SharedEventStatus.DELETED)) : Not(SharedEventStatus.DELETED);
        const [events, total] = await this._shared.findAndCount({
            where: [
                { status: condition, owner: { id: ownerId } }, 
                { status: condition, invites: { email: user.CMUEmail } },
            ],
            relations: ["invites", "members", "events", "events.owner", "owner"],
            take: params.noPagination ? undefined : params.limit,
            skip: params.noPagination ? undefined : params.offset,
            order: { id: "DESC" }
        });
        return {
            items: events,
            total,
            limit: params.limit,
            offset: params.offset
        };
    }
    
    public async getSharedEventByID(
        ownerId: number, 
        eventId: number, 
        params: { 
            status?: SharedEventStatus,
            relations?: (keyof SharedEvent)[],
            owned?: boolean
        } = {}
    ): Promise<SharedEvent> {
        const user = await this._userService.getUserById(ownerId);
        const condition = params.status ? Or(Equal(params.status), Not(SharedEventStatus.DELETED)) : Not(SharedEventStatus.DELETED);
        const event = await this._shared.findOne({
            where: [
                { id: eventId, status: condition, owner: { id: ownerId } }, 
                params.owned ? { id: eventId, status: condition, invites: { email: user.CMUEmail } } : undefined
            ],
            relations: params.relations || ["invites", "members", "events", "events.owner", "owner"],
            order: { id: "DESC" }
        });
        if (!event)
            throw new Error("Event not found.");
        return event;
    }

    public async addSharedEvent(ownerId: number, event: {
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
    }): Promise<SharedEvent> {
        const user = await this._userService.getUserById(ownerId);
        if (event.invites.some(email => user.CMUEmail === email))
            throw new Error("Cannot invite owner into thier own event.");
        const savedEvent = await this._shared.save(
            this._shared.create({
                owner: { id: ownerId },
                title: event.title,
                reminders: event.reminders,
                idealDays: event.idealDays,
                idealTimeRange: event.idealTimeRange,
                duration: event.duration,
                status: SharedEventStatus.PENDING,
                members: [user],
                invites: []
            })
        );
        savedEvent.invites = await this._invite.save(
            this._invite.create(event.invites.map(email => ({
                event: { id: savedEvent.id },
                email
            })
        )));
        await this._notificationService.notifyByEmails(
            event.invites,
            NotificationType.EVENT_CREATED,
            { eventId: savedEvent.id, eventTitle: savedEvent.title }
        );
        return savedEvent;
    }

    private async _removeAllEvents(ownerId: number, eventId: number): Promise<void> {
        const event = await this._shared.findOne({
            where: { id: eventId, status: Not(SharedEventStatus.DELETED), owner: { id: ownerId } },
            relations: ["events"]
        });
        if (event.events)
            await this._event.remove(event.events);
    }

    private async _removeAllInvites(ownerId: number, eventId: number): Promise<void> {
        const invites = await this._invite.findBy({
            event: { id: eventId, owner: { id: ownerId } }
        });
        await this._invite.remove(invites);
    }

    public async deleteSharedEventByID(ownerId: number, id: number): Promise<void> {
        const result = await this._shared.update(
            { id, status: Not(SharedEventStatus.DELETED), owner: { id: ownerId } },
            { status: SharedEventStatus.DELETED }
        );
        if (!result.affected)
            throw new Error(SharedEventServiceError.SHARED_EVENT_NOT_FOUND);
        await this._removeAllEvents(ownerId, id);
        await this._removeAllInvites(ownerId, id);
        const event = await this._shared.findOne({
            where: { id, status: Not(SharedEventStatus.DELETED), owner: { id: ownerId } },
            relations: ["events"]
        });
        await this._notificationService.notifyByEmails(
            event.members.map(member => member.CMUUsername),
            NotificationType.EVENT_DELETED,
            { eventId: event.id, eventTitle: event.title }
        )
    }

    public async _handleInvite(status: InviteStatus.ACCEPTED | InviteStatus.REJECTED, userId: number, eventId: number) {
        const user = await this._userService.getUserById(userId);
        const event = await this._shared.findOne({
            where: {
                id: eventId, 
                status: SharedEventStatus.PENDING,
                invites: { 
                    email: user.CMUEmail,
                    status: InviteStatus.PENDING
                }
            },
            relations: ["owner", "invites", "members"]
        });
        if (!event)
            throw new Error(SharedEventServiceError.INVITE_NOT_FOUND);
        if (event.owner.id === userId)
            throw new Error(`Cannot get ${status} by your own event.`);
        const invite = event.invites.find(invite => invite.email === user.CMUEmail);
        invite.status = status;
        await this._invite.save(invite);
        if (status === InviteStatus.ACCEPTED) {
            event.members.push(user);
            await this._shared.save(event);
        }
        await this._notificationService.notifyByIDs(
            [event.owner.id],
            InviteStatus.ACCEPTED ? NotificationType.INVITE_ACCEPTED : NotificationType.INVITE_REJECTED,
            { email: user.CMUEmail }
        );
    }

    public async acceptSharedEventByID(ownerId: number, eventId: number): Promise<void> {
        return this._handleInvite(InviteStatus.ACCEPTED, ownerId, eventId);
    }

    public async rejectSharedEventByID(ownerId: number, eventId: number): Promise<void> {
        return this._handleInvite(InviteStatus.REJECTED, ownerId, eventId);
    }

    public async arrangeSharedEventByID(ownerId: number, eventId: number): Promise<SharedEvent> {
        const shared = await this.getSharedEventByID(ownerId, eventId, { status: SharedEventStatus.PENDING, owned: true });
        const busyEvents = await this._event
            .createQueryBuilder("event")
            .leftJoinAndSelect("event.owner", "owner")
            .leftJoinAndSelect("event.groups", "grp")
            .where("owner.id IN (:...memberIds)", { memberIds: shared.members.map(member => member.id) })
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
        const slots = findTimeSlotInRange({
            ...shared.idealTimeRange,
            duration: shared.duration,
            idealDays: shared.idealDays,
            busyEvents
        });
        shared.status = SharedEventStatus.ARRANGED;
        shared.events = await Promise.all(
            shared.members.flatMap(member => 
                slots.map(slot => this._calendarService.addEvent(
                    member.id,
                    { title: shared.title, start: slot.start, end: slot.end },
                    { type: CalendarEventType.UNSAVED_SHARED }
                    )
                )
            )
        );
        return this._shared.save(shared);
    }

    public async saveSharedEventByID(ownerId: number, eventId: number): Promise<SharedEvent> {
        const result = await this._shared.update(
            { id: eventId, status: SharedEventStatus.ARRANGED, owner: { id: ownerId } },
            { status: SharedEventStatus.SAVED }
        );
        if (!result.affected)
            throw new Error(SharedEventServiceError.SHARED_EVENT_NOT_FOUND);
        const event = await this.getSharedEventByID(ownerId, eventId, { status: SharedEventStatus.SAVED, owned: true });
        await Promise.all(
            (event.events || []).map(evnt => this._event.update(
                { id: evnt.id }, 
                { type: CalendarEventType.SAVED_SHARED }
            ))
        );
        await this._notificationService.notifyByEmails(
            event.members.map(member => member.CMUEmail),
            NotificationType.MEETING_SCHEDULED,
            { eventId: event.id, eventTitle: event.title }
        );
        return await this.getSharedEventByID(ownerId, eventId, { status: SharedEventStatus.SAVED, owned: true });
    }

    public async deleteAllEvents(userId: number): Promise<void> {
        const events = await this._event.find({
            where: { owner: { id: userId } }
        });
        await this._event.remove(events);
    }
}

export enum SharedEventServiceError {
    SHARED_EVENT_NOT_FOUND = "Shared event not found.",
    INVITE_NOT_FOUND = "Invite not found."
}

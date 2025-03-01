import { Between, DataSource, Equal, Or, Repository } from "typeorm";
import { CalendarEvent } from "../models/calendarEvent.entity.js";
import { CalendarEventGroup as EventGroup } from "../models/calendarEventGroup.entity.js";
import { CalendarEventType, GroupTitle, SharedEventStatus } from "../types/enums.js";
import { fCalendarEvent, fEventGroup } from "../helpers/formatter.js";
import * as swagger from "../types/swagger.js";

export class CalendarService {
    private _event: Repository<CalendarEvent>;
    private _group: Repository<EventGroup>;
    constructor(ds: DataSource) {
        this._event = ds.getRepository(CalendarEvent);
        this._group = ds.getRepository(EventGroup);
    }

    public async addEvent(ownerId: number, event: swagger.CalendarEventNew, params: { type?: CalendarEventType } = {}): Promise<CalendarEvent> {
        if (event.start > event.end)
            throw new Error("Event end before it start.");
        const ownerGroup = await this.getOwnerGroupByOwner(ownerId);
        const newEventUnsaved = this._event.create({
            ...event,
            type: params.type,
            owner: { id: ownerId },
            groups: [ownerGroup]
        });
        return this._event.save(newEventUnsaved);
    }

    public async getEventByOwner(ownerId: number, eventId: number): Promise<swagger.CalendarEvent> {
        const event = await this._event.findOne({ 
            where : { 
                id: eventId,
                type: Or(
                    Equal(CalendarEventType.NON_SHARED),
                    Equal(CalendarEventType.SAVED_SHARED)
                ),
                owner: { id: ownerId }
            },
            relations: ["groups"]
        });
        if (!event)
            throw new Error("Event not found.")
        return fCalendarEvent(event);
    }

    public async editEventByID(ownerId: number, eventId: number, newEvent: swagger.CalendarEventEdit): Promise<swagger.CalendarEvent> {
        if (newEvent.start > newEvent.end)
            throw new Error("Event end before it start.");
        const originalEvent = await this._event.findOne({ 
            where: { 
                id: eventId,
                type: CalendarEventType.NON_SHARED,
                owner: { id: ownerId }
            },
            relations: ["groups"]
        });
        if (!originalEvent)
            throw new Error("Event not found.");
        const modifiedEvent = await this._event.save({...originalEvent, ...newEvent});
        return fCalendarEvent(modifiedEvent);
    }

    public async deleteUnsavedSharedEventByID(ownerId: number, eventId: number): Promise<CalendarEvent> {
        return this._event.createQueryBuilder("event")
            .innerJoin("shared_event_events_calendar_event", "see", "see.calendarEventId = event.id")
            .innerJoin("shared_event", "se", "se.id = see.sharedEventId")
            .where("event.id = :eventId", { eventId })
            .andWhere("se.ownerId = :ownerId", { ownerId })
            .andWhere("se.status = :status", { status: SharedEventStatus.ARRANGED })
            .andWhere("event.type = :type", { type: CalendarEventType.UNSAVED_SHARED })
            .getOne();
    }

    public async deleteEventByID(ownerId: number, eventId: number): Promise<void> {
        const event = (await this._event.findOneBy({
            id: eventId,
            type: CalendarEventType.NON_SHARED,
            owner: { id: ownerId } 
        })) || (await this.deleteUnsavedSharedEventByID(ownerId, eventId));
        if (!event)
            throw new Error("Event not found.");
        await this._event.remove(event);
    }

    public async getEventsByOwner(ownerId, params: { startDate: Date, endDate: Date, limit: number, offset: number }): Promise<swagger.Pagination<swagger.CalendarEvent>> {
        const [events, total] = await this._event.findAndCount({
            where: { 
                owner: { id: ownerId },
                start: Between(params.startDate, params.endDate)
            },
            relations: ["groups"],
            take: params.limit,
            skip: params.offset,
            order: { start: "ASC" }
        });
        return {
            calendar: events.map(fCalendarEvent),
            pagination: {
                total, 
                limit: params.limit, 
                offset: params.offset
            }
        };
    }

    public async getGroupsByOwner(ownerId: number): Promise<swagger.EventGroup[]> {
        const groups = await this._group.findBy({ owner: { id: ownerId } });
        return groups.map(fEventGroup);
    }

    public async getGroupByOwner(ownerId: number, groupdId: number): Promise<swagger.EventGroup> {
        const group = await this._group.findOneBy({ id: groupdId, owner: { id: ownerId } });
        if (!group)
            throw new Error("Group not found.");
        return fEventGroup(group);
    }

    public async getOwnerGroupByOwner(ownerId: number): Promise<swagger.EventGroup> {
        const group = await this._group.findOneBy({ 
            title: GroupTitle.OWNER, 
            owner: { id: ownerId } 
        });
        if (!group)
            throw new Error("Group not found.");
        return fEventGroup(group);
    }

    public async editGroupByOwner(ownerId: number, groupId: number, updatedGroup: swagger.EventGroupEdit): Promise<swagger.EventGroup> {
        const originalGroup = await this._group.findOneBy({ id: groupId, owner: { id: ownerId } });
        if (!originalGroup)
            throw new Error("Group not found.");
        const modifiedGroup = await this._group.save({...originalGroup, ...updatedGroup});
        return fEventGroup(modifiedGroup);
    }

    public async getNotifiableEvents(start: Date, end: Date): Promise<CalendarEvent[]> {
        return await this._event
            .createQueryBuilder("event")
            .innerJoin("event.groups", "grp")
            .leftJoinAndSelect("event.owner", "owner")
            .where("grp.reminders <> '{}'")
            .andWhere(`EXISTS (
                SELECT 1
                FROM unnest(grp.reminders) AS reminder_minutes
                WHERE (event.start - (reminder_minutes * interval '1 minute')) BETWEEN :start AND :end
            )`, { start, end })
            .getMany();
    }
}

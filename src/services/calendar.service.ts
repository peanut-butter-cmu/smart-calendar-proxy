import { Between, DataSource, Repository } from "typeorm";
import { CalendarEvent } from "../models/CalendarEvent.entity.js";
import { CalendarEventGroup as EventGroup, EventGroupType } from "../models/EventGroup.entity.js";
import { fCalendarEvent, fEventGroup } from "../helpers/formatter.js";
import * as swagger from "../types/swagger.js";

export class CalendarService {
    private _event: Repository<CalendarEvent>;
    private _group: Repository<EventGroup>;
    constructor(ds: DataSource) {
        this._event = ds.getRepository(CalendarEvent);
        this._group = ds.getRepository(EventGroup);
    }

    async addEvent(ownerId: number, event: swagger.CalendarEventNew, params: { readOnly?: boolean } = {}): Promise<swagger.CalendarEvent> {
        if (event.start > event.end)
            throw new Error("Event end before it start.");
        const ownerGroup = await this._group.findOneBy({ 
            title: "Owner", 
            type: EventGroupType.SYSTEM, 
            owner: { id: ownerId }
        });
        if (!ownerGroup)
            throw new Error("Owner group not found.");
        const newEventUnsaved = this._event.create({
            ...event,
            owner: { id: ownerId },
            groups: [ownerGroup],
            readOnly: params.readOnly === true
        });
        const newEvent = await this._event.save(newEventUnsaved);
        return fCalendarEvent(newEvent);
    }

    async getEventByOwner(ownerId: number, eventId: number): Promise<swagger.CalendarEvent> {
        const event = await this._event.findOne({ 
            where : { 
                id: eventId, 
                owner: { id: ownerId }
            },
            relations: ["groups"]
        });
        if (!event)
            throw new Error("Event not found.")
        return fCalendarEvent(event);
    }

    async editEventByID(ownerId: number, eventId: number, newEvent: swagger.CalendarEventEdit): Promise<swagger.CalendarEvent> {
        if (newEvent.start > newEvent.end)
            throw new Error("Event end before it start.");
        const originalEvent = await this._event.findOne({ 
            where: { 
                id: eventId,
                readOnly: false,
                owner: { id: ownerId }
            },
            relations: ["groups"]
        });
        if (!originalEvent)
            throw new Error("Event not found.");
        const modifiedEvent = await this._event.save({...originalEvent, ...newEvent});
        return fCalendarEvent(modifiedEvent);
    }

    async deleteEventByID(ownerId: number, eventId: number): Promise<void> {
        const event = await this._event.findOneBy({
             id: eventId,
             readOnly: false,
             owner: { id: ownerId } 
        });
        if (!event)
            throw new Error("Event not found.");
        await this._event.remove(event);
    }

    async getEventsByOwner(ownerId, params: { startDate: Date, endDate: Date, limit: number, offset: number }): Promise<swagger.Pagination<swagger.CalendarEvent>> {
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

    async getGroupsByOwner(ownerId: number): Promise<swagger.EventGroup[]> {
        const groups = await this._group.findBy({ owner: { id: ownerId } });
        return groups.map(fEventGroup);
    }

    async getGroupByOwner(ownerId: number, groupdId: number): Promise<swagger.EventGroup> {
        const group = await this._group.findOneBy({ id: groupdId, owner: { id: ownerId } });
        if (!group)
            throw new Error("Group not found.");
        return fEventGroup(group);
    }
    
    async editGroupByOwner(ownerId: number, groupId: number, updatedGroup: swagger.EventGroupEdit): Promise<swagger.EventGroup> {
        const originalGroup = await this._group.findOneBy({ id: groupId, owner: { id: ownerId } });
        if (!originalGroup)
            throw new Error("Group not found.");
        const modifiedGroup = await this._group.save({...originalGroup, ...updatedGroup});
        return fEventGroup(modifiedGroup);
    }

    async getNotifiableEvents(start: Date, end: Date): Promise<CalendarEvent[]> {
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

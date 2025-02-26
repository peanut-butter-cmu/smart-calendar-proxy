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

    async addEvent(ownerId: number, event: swagger.CalendarEventNew): Promise<swagger.CalendarEvent> {
        const ownerGroup = await this._group.findOneBy({ 
            title: "Owner", 
            type: EventGroupType.SYSTEM, 
            owner: { id: ownerId }
        });
        if (!ownerGroup)
            throw new Error("Owner group not found.")
        const newEventUnsaved = this._event.create({
            ...event,
            owner: { id: ownerId },
            groups: [ownerGroup]
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
        const originalEvent = await this._event.findOne({ 
            where: { 
                id: eventId, 
                owner: { id: ownerId }
            },
            relations: ["groups"]
        });
        if (!originalEvent)
            throw new Error("Event not found.")
        const groups = await this._group.findBy(newEvent.groups.map(id => ({ id, owner: { id: ownerId } })));
        if (!groups.length)
            throw new Error("Group(s) not found.")
        const modifiedEvent = await this._event.save({...originalEvent, ...newEvent, groups});
        return fCalendarEvent(modifiedEvent);
    }

    async deleteEventByID(ownerId: number, eventId: number): Promise<void> {
        const event = await this._event.findOneBy({
             id: eventId, 
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
                offset: params.offset,
                hasMore: params.offset + params.limit < total
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
}

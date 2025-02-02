import { DataSource, Repository } from "typeorm";
import { CalendarEvent } from "../../models/calendarEvent.entity.js";
import { CalendarEventGroup } from "../../models/calendarEventGroup.entity.js";

export type NoMetadata<T> = {
    [K in keyof T]: K extends "created" | "modified" ? never : T[K];
};

export type CalendarEventResp = Omit<NoMetadata<CalendarEvent>, "groups"> & {
    groups: number[];
};

export type EventGroupResp = Pick<CalendarEventGroup, "id" | "title">;

export interface ICalendarService {
    createEvent(ownerId: number, newEvent: Omit<CalendarEvent, "id">): Promise<CalendarEventResp | null>;
    getEventById(ownerId: number, eventId: number): Promise<CalendarEventResp | null>;
    editEventById(ownerId: number, eventId: number, updatedEvent: Partial<CalendarEvent>): Promise<CalendarEventResp | null>;
    deleteEventById(ownerId: number, eventId: number): Promise<boolean>;
    getEventsByOwner(ownerId: number): Promise<CalendarEventResp[]>;
    getGroupsByOwner(ownerId: number): Promise<EventGroupResp[]>;
}

export class CalendarService implements ICalendarService {
    private _calendarEvent: Repository<CalendarEvent>;
    private _calendarEGroup: Repository<CalendarEventGroup>;
    constructor(dataSource: DataSource) {
        this._calendarEvent = dataSource.getRepository(CalendarEvent);
        this._calendarEGroup = dataSource.getRepository(CalendarEventGroup);
    }
    private static _removeMetadata<T extends { created: Date, modified: Date }>(original: T): NoMetadata<T> {
        const cloned = {...original};
        delete cloned.modified;
        delete cloned.created;
        return cloned as NoMetadata<T>;
    }
    private static _transformGroups(event: CalendarEvent): CalendarEventResp {
        return {...(CalendarService._removeMetadata(event)), groups: event.groups.map(({id}) => id)}
    }
    async createEvent(userId: number, event: Omit<CalendarEvent, "id">): Promise<CalendarEventResp | null> {
        const ownerGroup = await this._calendarEGroup.findOneBy({ 
            title: "Owner", 
            system: true, 
            owner: { id: userId }
        });
        if (!ownerGroup)
            return null;
        const newEvent = this._calendarEvent.create({
            ...event,
            owner: { id: userId },
            groups: [ownerGroup]
        });
        return CalendarService._transformGroups(await this._calendarEvent.save(newEvent));
    }
    async getEventById(ownerId: number, eventId: number): Promise<CalendarEventResp | null> {
        const event = await this._calendarEvent.findOne({ 
            where : { id: eventId, owner: { id: ownerId } },
            relations: ["groups"]
        });
        if (!event)
            return null;
        else
            return CalendarService._transformGroups(event);
    }
    async editEventById(ownerId: number, eventId: number, newEvent: Partial<CalendarEvent>): Promise<CalendarEventResp | null> {
        const originalEvent = await this._calendarEvent.findOne({ 
            where: { id: eventId, owner: { id: ownerId } },
            relations: ["groups"]
        });
        if (!originalEvent)
            return null;
        if (newEvent.groups) {
            const uniqueGroups = [...new Set(newEvent.groups)];
            newEvent.groups = await this._calendarEGroup.findBy(uniqueGroups.map(group => ({ ...group, owner: { id: ownerId } })));
            
        }
        const modifiedEvent = await this._calendarEvent.save({...originalEvent, ...newEvent});
        return CalendarService._transformGroups(modifiedEvent);
    }
    async deleteEventById(ownerId: number, eventId: number): Promise<boolean> {
        const findResult = await this._calendarEvent.findOneBy({ id: eventId, owner: { id: ownerId } });
        if (!findResult)
            return false;
        const result = await this._calendarEvent.remove(findResult);
        return result !== null;
    }
    async getEventsByOwner(ownerId: number): Promise<CalendarEventResp[]> {
        const events = await this._calendarEvent.find({
            where: { owner: { id: ownerId } },
            relations: ["groups"]
        });
        return events
            .map(({ id, title, start, end, groups }) => ({ id, title, start, end, groups })) // filter only needed keys
            .map(CalendarService._transformGroups); // map groups to extract only id
    }
    async getGroupsByOwner(ownerId: number): Promise<EventGroupResp[]> {
        const groups = await this._calendarEGroup.findBy({ owner: { id: ownerId } });
        return groups.map(({ id, title }) => ({ id, title }));
    }
}

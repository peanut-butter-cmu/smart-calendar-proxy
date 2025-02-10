import { DataSource, Repository } from "typeorm";
import { CalendarEvent } from "../../models/calendarEvent.entity.js";
import { CalendarEventGroup } from "../../models/calendarEventGroup.entity.js";
import { CalendarTransaction } from "./transaction.js";
import { Session } from "../../models/session.entity.js";
import { RegCMUFetcher } from "../../fetcher/reg-cmu.js";

export type CalendarEventResp = Omit<CalendarEvent, "groups" | "created" | "modified"> & {
    groups: number[];
};

export type EventGroupResp = Omit<CalendarEventGroup, "system" | "created" | "modified">;

export interface ICalendarService {
    createEvent(ownerId: number, newEvent: Omit<CalendarEvent, "id">): Promise<CalendarEventResp | null>;
    getEventById(ownerId: number, eventId: number): Promise<CalendarEventResp | null>;
    editEventById(ownerId: number, eventId: number, updatedEvent: Partial<CalendarEvent>): Promise<CalendarEventResp | null>;
    deleteEventById(ownerId: number, eventId: number): Promise<boolean>;
    getEventsByOwner(ownerId: number): Promise<CalendarEventResp[]>;
    getGroupsByOwner(ownerId: number): Promise<EventGroupResp[]>;
    syncEvents(ownerId: number): Promise<void>;
    getGroupById(ownerId: number, groupId: number): Promise<EventGroupResp | null>;
    editGroupById(ownerId: number, groupId: number, updatedGroup: Partial<CalendarEventGroup>): Promise<EventGroupResp | null>;
}

export class CalendarService implements ICalendarService {
    private _calendarEvent: Repository<CalendarEvent>;
    private _calendarEGroup: Repository<CalendarEventGroup>;
    private _ds: DataSource;
    constructor(dataSource: DataSource) {
        this._calendarEvent = dataSource.getRepository(CalendarEvent);
        this._calendarEGroup = dataSource.getRepository(CalendarEventGroup);
        this._ds = dataSource;
    }
    private static _transformEventResp(event: CalendarEvent | null): CalendarEventResp | null {
        if (!event)
            return null;
        return {
            id: event.id,
            title: event.title,
            groups: event.groups.map(({id}) => id),
            start: event.start,
            end: event.end,
            owner: event.owner,
        };
    }
    private static _transformGroupResp(group: CalendarEventGroup | null): EventGroupResp | null {
        if (!group)
            return null;
        return {
            id: group.id,
            title: group.title,
            owner: group.owner,
            color: group.color,
            priority: group.priority,
            isBusy: group.isBusy
        };
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
        return CalendarService._transformEventResp(await this._calendarEvent.save(newEvent));
    }
    async getEventById(ownerId: number, eventId: number): Promise<CalendarEventResp | null> {
        const event = await this._calendarEvent.findOne({ 
            where : { id: eventId, owner: { id: ownerId } },
            relations: ["groups"]
        });
        if (!event)
            return null;
        else
            return CalendarService._transformEventResp(event);
    }
    async editEventById(ownerId: number, eventId: number, newEvent: Partial<CalendarEvent>): Promise<CalendarEventResp | null> {
        const originalEvent = await this._calendarEvent.findOne({ 
            where: { id: eventId, owner: { id: ownerId } },
            relations: ["groups"]
        });
        if (newEvent.groups) {
            newEvent.groups = await Promise.all(newEvent.groups.map(async group => this._calendarEGroup.findOneBy(group)));
            if (newEvent.groups.some(group => group === null))
                return null;
        }
        const modifiedEvent = await this._calendarEvent.save({...originalEvent, ...newEvent});
        return CalendarService._transformEventResp(modifiedEvent);
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
            .map(CalendarService._transformEventResp); // map groups to extract only id
    }
    async getGroupsByOwner(ownerId: number): Promise<EventGroupResp[]> {
        const groups = await this._calendarEGroup.findBy({ owner: { id: ownerId } });
        return groups.map(CalendarService._transformGroupResp);
    }
    async syncEvents(ownerId: number): Promise<void> {
        const session = await this._ds.manager.findOneBy(Session, { owner: { id: ownerId } });
        const reg = new RegCMUFetcher({ username: session.CMUUsername, password: session.CMUPassword });
        const courses = await reg.getCourses();
        const courseGroups = await this._ds.manager.findBy(CalendarEventGroup, { owner: { id: ownerId } });

        const queryRunner = this._ds.createQueryRunner();
        const calendarTrans = new CalendarTransaction(queryRunner, ownerId);
        await calendarTrans.init();
        await calendarTrans.cleanClassEvent();
        await calendarTrans.cleanMidtermExamEvent();
        await calendarTrans.cleanFinalExamEvent();
        await calendarTrans.generateClassEvent(courses, courseGroups);
        await calendarTrans.generateMidtermExamEvent(courses, courseGroups);
        await calendarTrans.generateFinalExamEvent(courses, courseGroups);
        await calendarTrans.finalize();
    }
    async getGroupById(ownerId: number, groupId: number): Promise<EventGroupResp | null> {
        const group = await this._calendarEGroup.findOneBy({ id: groupId, owner: { id: ownerId } });
        return CalendarService._transformGroupResp(group);
    }
    async editGroupById(ownerId: number, groupId: number, updatedGroup: Partial<CalendarEventGroup>): Promise<EventGroupResp | null> {
        const originalGroup = await this._calendarEGroup.findOneBy({ id: groupId, owner: { id: ownerId } });
        const modifiedGroup = await this._calendarEGroup.save({...originalGroup, ...updatedGroup});
        return CalendarService._transformGroupResp(modifiedGroup);
    }
}

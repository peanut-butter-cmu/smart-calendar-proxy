import { DataSource, Repository } from "typeorm";
import { CalendarEvent } from "../../models/calendarEvent.entity.js";
import { CalendarEventGroup, EventGroupType } from "../../models/calendarEventGroup.entity.js";
import { CalendarTransaction } from "./transaction.js";
import { RegCMUFetcher } from "../../fetcher/reg-cmu.js";
import { User } from "../../models/user.entity.js";

export type CalendarEventResp = Omit<CalendarEvent, "owner" | "groups" | "created" | "modified"> & {
    groups: number[];
};

export type EventGroupResp = Omit<CalendarEventGroup, "owner" | "readonly" | "created" | "modified" | "events">;

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
        };
    }
    private static _transformGroupResp(group: CalendarEventGroup | null): EventGroupResp | null {
        if (!group)
            return null;
        return {
            id: group.id,
            title: group.title,
            type: group.type,
            color: group.color,
            priority: group.priority,
            isBusy: group.isBusy,
            reminders: group.reminders
        };
    }
    async createEvent(userId: number, event: Omit<CalendarEvent, "id">): Promise<CalendarEventResp | null> {
        const ownerGroup = await this._calendarEGroup.findOneBy({ 
            title: "Owner", 
            type: EventGroupType.SYSTEM, 
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
            newEvent.groups = await Promise.all(newEvent.groups.map(async ({ id, owner }) => this._calendarEGroup.findOneBy({ id, owner })));
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
        const user = await this._ds.manager.findOneBy(User, { id: ownerId });
        const reg = new RegCMUFetcher({ username: user.CMUUsername, password: user.CMUPassword });
        const courses = await reg.getCourses();
        const courseGroups = await this._ds.manager.findBy(CalendarEventGroup, { owner: { id: ownerId } });

        const queryRunner = this._ds.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const calendarTrans = new CalendarTransaction(queryRunner, ownerId);
            await calendarTrans.cleanClassEvent();
            await calendarTrans.cleanMidtermExamEvent();
            await calendarTrans.cleanFinalExamEvent();
            await calendarTrans.generateClassEvent(courses, courseGroups);
            await calendarTrans.generateMidtermExamEvent(courses, courseGroups);
            await calendarTrans.generateFinalExamEvent(courses, courseGroups);
        } catch(error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
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

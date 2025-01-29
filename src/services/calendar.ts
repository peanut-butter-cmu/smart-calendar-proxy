import { DataSource, FindOptionsWhere, Repository } from "typeorm";
import { CalendarEvent } from "../models/calendarEvent.entity.js";
import { User } from "../models/user.entity.js";
import { CalendarEventGroup } from "../models/calendarEventGroup.entity.js";

export type CalendarEventResp = Pick<CalendarEvent, "id" | "title" | "start" | "end"> & {
    groups: number[]
}

export type EventGroupResp = Pick<CalendarEventGroup, "id" | "title">;

export interface ICalendarService {
    getEventById(owner: FindOptionsWhere<User>, id: number): Promise<CalendarEventResp | null>;
    editEventById(owner: FindOptionsWhere<User>, id: number, event: Partial<CalendarEvent>): Promise<CalendarEventResp | null>;
    deleteEventById(owner: FindOptionsWhere<User>, id: number): Promise<boolean>;
    getEventsByOwner(owner: FindOptionsWhere<User>): Promise<CalendarEventResp[]>;
    getGroupsByOwner(owner: FindOptionsWhere<User>): Promise<EventGroupResp[]>;
}

export class CalendarService implements ICalendarService {
    private _calendarEvent: Repository<CalendarEvent>;
    private _calendarEGroup: Repository<CalendarEventGroup>;
    constructor(dataSource: DataSource) {
        this._calendarEvent = dataSource.getRepository(CalendarEvent);
        this._calendarEGroup = dataSource.getRepository(CalendarEventGroup);
    }
    private static _transformEventGroup(event: CalendarEvent): CalendarEventResp {
        return {...event, groups: event.groups.map(({id}) => id)}
    }
    async getEventById(owner: FindOptionsWhere<User>, id: number): Promise<CalendarEventResp | null> {
        const event = await this._calendarEvent.findOne({ 
            where : { id, owner },
            relations: ["groups"]
        });
        if (!event)
            return null;
        else
            return CalendarService._transformEventGroup(event);
    }
    async editEventById(owner: FindOptionsWhere<User>, id: number, event: Partial<CalendarEvent>): Promise<CalendarEventResp | null> {
        const originalEvent = await this._calendarEvent.findOne({ 
            where: { id, owner },
            relations: ["groups"]
        });
        return CalendarService._transformEventGroup({...originalEvent, ...event});
    }
    async deleteEventById(owner: FindOptionsWhere<User>, id: number): Promise<boolean> {
        const result = await this._calendarEvent.delete({ id, owner });
        return result.affected >= 1;
    }
    async getEventsByOwner(owner: FindOptionsWhere<User>): Promise<CalendarEventResp[]> {
        const events = await this._calendarEvent.find({
            where: { owner },
            relations: ["groups"]
        });
        return events
            .map(({ id, title, start, end, groups }) => ({ id, title, start, end, groups })) // filter only needed keys
            .map(CalendarService._transformEventGroup); // map groups to extract only id
    }

    async getGroupsByOwner(owner: FindOptionsWhere<User>): Promise<EventGroupResp[]> {
        const groups = await this._calendarEGroup.findBy({ owner });
        return groups.map(({ id, title }) => ({ id, title }));
    }
}

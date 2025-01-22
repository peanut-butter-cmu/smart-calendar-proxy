import { DataSource, FindOptionsWhere, Repository } from "typeorm";
import { CalendarEvent } from "../models/calendarEvent.entity.js";
import { User } from "@/models/user.entity.js";

export interface ICalendarService {
    getEventsByOwner(owner: FindOptionsWhere<User>): Promise<CalendarEvent[]>;
}

export class CalendarService implements ICalendarService {
    private _calendarEvent: Repository<CalendarEvent>;
    constructor(dataSource: DataSource) {
        this._calendarEvent = dataSource.getRepository(CalendarEvent);
    }

    async getEventsByOwner(owner: FindOptionsWhere<User>): Promise<CalendarEvent[]> {
        return this._calendarEvent.findBy({ owner });
    }
}

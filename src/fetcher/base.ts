import { CalendarEvent } from "../models/calendarEvent.entity.js";

export interface IFetcher {
    getEvents(): Promise<CalendarEvent[]>
}
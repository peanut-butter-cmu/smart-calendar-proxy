import { CalendarEvent } from "../models/CalendarEvent.entity.js";

export interface IFetcher {
    getEvents(): Promise<CalendarEvent[]>
}
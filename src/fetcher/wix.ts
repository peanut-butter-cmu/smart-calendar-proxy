import { CalendarEvent } from "../models/calendarEvent.entity.js";
import { IFetcher } from "./base.js";

export class WixFetcher implements IFetcher {
    getEvents(): Promise<CalendarEvent[]> {
        throw new Error("Method not implemented.");
    }
    
}
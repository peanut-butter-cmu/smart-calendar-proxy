import { CalendarEvent } from "../models/CalendarEvent.entity.js";
import { IFetcher } from "./base.js";

export class WixFetcher implements IFetcher {
    getEvents(): Promise<CalendarEvent[]> {
        throw new Error("Method not implemented.");
    }
    
}
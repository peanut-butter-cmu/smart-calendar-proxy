import { CalendarEvent } from "../models/CalendarEvent.entity.js";
import { IFetcher } from "./base.js";

export class MangoFetcher implements IFetcher {
    getEvents(): Promise<CalendarEvent[]> {
        throw new Error("Method not implemented.");
    }
}
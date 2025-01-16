import { CalendarEvent } from "@/models/event.js";
import { Fetcher } from "./base.js";

class MangoFetcher implements Fetcher {
    getEvents(): Promise<CalendarEvent[]> {
        throw new Error("Method not implemented.");
    }
}
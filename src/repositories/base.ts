import { SHA256Digest } from "@/models/base.js";
import { CalendarEvent } from "@/models/event.js";

export interface Repository {
    getEvents(id: SHA256Digest): Promise<CalendarEvent[]>;
    getSemesterPeriod(): Promise<{start: Date, end: Date}>
}
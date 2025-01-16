import { SHA256Digest } from "@/models/base.js";
import { Repository } from "./base.js";
import { CalendarEvent } from "@/models/event.js";

export class EnvRepository implements Repository {
    async getEvents(id: SHA256Digest): Promise<CalendarEvent[]> {
        return [];
    }

    async getSemesterPeriod(): Promise<{ start: Date; end: Date; }> {
        return {
            start: new Date(process.env.TEST_SEMESTER_START!),
            end: new Date(process.env.TEST_SEMESTER_END!)
        }
    }
}
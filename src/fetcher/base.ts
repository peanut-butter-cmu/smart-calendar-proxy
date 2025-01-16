import { CalendarEvent } from "@/models/event.js"

export interface Fetcher {
    getEvents(): Promise<CalendarEvent[]>
}
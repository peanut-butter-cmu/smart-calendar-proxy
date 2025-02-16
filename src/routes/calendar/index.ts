import { ICalendarService } from "../../services/calendar/index.js";
import { Router } from "express";
import { createEventRoutes } from "./event.js";
import { createGroupRoutes } from "./group.js";
import { SharedCalendarService } from "@/services/calendar/shared.js";
import { createSharedCalendarRoutes } from "./shared.js";

export type JWTPayload = {
    id: number;
}

export function createCalendarRouter(
    calendarService: ICalendarService,
    sharedCalendarService: SharedCalendarService
) {
    const router = Router()
        .use(createEventRoutes(calendarService))
        .use(createGroupRoutes(calendarService))
        .use(createSharedCalendarRoutes(sharedCalendarService))
    return router;
}
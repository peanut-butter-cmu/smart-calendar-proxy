import { ICalendarService } from "../../services/calendar/index.js";
import { Router } from "express";
import { createEventRoutes } from "./event.js";
import { createGroupRoutes } from "./group.js";

export type JWTPayload = {
    id: number;
}

export function createCalendarRouter(calendarService: ICalendarService) {
    const router = Router();
    router.use(createEventRoutes(calendarService));
    router.use(createGroupRoutes(calendarService));
    return router;
}
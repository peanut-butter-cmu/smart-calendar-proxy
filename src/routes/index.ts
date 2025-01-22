import { Router } from "express";
import { createUserRouter } from "./user.js";
import { DataSource } from "typeorm";
import { UserService } from "../services/user.js";
import { CalendarService } from "../services/calendar.js";
import { createCalendarRouter } from "./calendar.js";

export function createRouter(dataSource: DataSource) {
    const calendarService = new CalendarService(dataSource);
    const userService = new UserService(dataSource);
    return Router()
        .use(createUserRouter(userService))
        .use(createCalendarRouter(calendarService));
}
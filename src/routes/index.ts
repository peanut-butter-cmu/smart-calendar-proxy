import { Router } from "express";
import { createUserRouter } from "./user.js";
import { DataSource } from "typeorm";
import { UserService } from "../services/user/index.js";
import { CalendarService } from "../services/calendar/index.js";
import { createCalendarRouter } from "./calendar/index.js";
import { SharedCalendarService } from "../services/calendar/shared.js";
import { NotificationService } from "../services/notification/index.js";
import { createNotificationRoutes } from "./notification.js";

export function createRouter(dataSource: DataSource) {
    const calendarService = new CalendarService(dataSource);
    const userService = new UserService(dataSource);
    const sharedCalendarService = new SharedCalendarService(dataSource);
    const notificationService = new NotificationService(dataSource);
    return Router()
        .use(createUserRouter(userService))
        .use(createCalendarRouter(calendarService, sharedCalendarService))
        .use(createNotificationRoutes(notificationService));
}

import { Router } from "express";
import { DataSource } from "typeorm";
import { createCalendarRouter } from "./calendar.route.js";
import { createUserRouter } from "./user.route.js";
import { createNotificationRouter } from "./notification.route.js";

export function createRouter(dataSource: DataSource) {
    return Router()
        .use(createUserRouter(dataSource))
        .use(createCalendarRouter(dataSource))
        .use(createNotificationRouter(dataSource));
}

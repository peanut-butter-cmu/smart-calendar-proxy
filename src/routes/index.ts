import { Router } from "express";
import { DataSource } from "typeorm";
import { createCalendarRouter } from "./calendar.route.js";
import { createUserRouter } from "./user.route.js";
import { createNotificationRouter } from "./notification.route.js";

export function createRouter(dataSource: DataSource) {
    const router = Router();
    router.use("/api", createUserRouter(dataSource));
    router.use("/api", createCalendarRouter(dataSource));
    router.use("/api", createNotificationRouter(dataSource));
    return router;
}

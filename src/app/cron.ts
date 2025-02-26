import dayjs from "dayjs";
import cron from "node-cron";

import { DataSource } from "typeorm";
import { CalendarService } from "../services/calendar.service.js";
import { NotificationService } from "../services/notification.service.js";
import { NotificationType } from "../models/notification.entity.js";
import { UserService } from "../services/user.service.js";

export function initCronJobs(ds: DataSource) {
    const calen = new CalendarService(ds);
    const noti = new NotificationService(ds);
    const usr = new UserService(ds);

    cron.schedule("*/10 * * * * *", async () => {
        const now = new Date();
        const tenSec = dayjs(now).add(10, "seconds").toDate();
        console.log("Cron Job: Time", new Date().toISOString());
        try {
            const events = await calen.getNotifiableEvents(now, tenSec);
            await Promise.all(
                events.map(event => noti.notifyByUsers(
                    [event.owner], 
                    NotificationType.EVENT_REMINDER, 
                    { eventId: event.id }
                ))
            );
            const users = await usr.getAllUsers();
            await Promise.all(
                users.map(user => noti.notifyFirebaseByUsers(
                    [user], 
                    NotificationType.EVENT_REMINDER, 
                    { eventId: 1 }
                ))
            );
        } catch(e) {
            console.error("Cron Job: Error", e);
        }
    });

    console.log("Cron jobs initialized");
};

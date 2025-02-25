import dayjs from "dayjs";
import cron from "node-cron";

import { DataSource } from "typeorm";
import { CalendarService } from "../services/calendar.service.js";
import { NotificationService } from "../services/notification.service.js";
import { NotificationType } from "../models/Notification.entity.js";

export function initCronJobs(ds: DataSource) {
    const calen = new CalendarService(ds);
    const noti = new NotificationService(ds);

    cron.schedule("*/10 * * * * *", async () => {
        const now = new Date();
        const tenSec = dayjs(now).add(10, "seconds").toDate();
        console.log("Cron Job: Time", new Date().toISOString());
        try {
            const events = await calen.getNotifiableEvents(now, tenSec);
            for (const event of events) {
                noti.notifyByUsers(
                    [event.owner], 
                    NotificationType.EVENT_REMINDER, 
                    { eventId: event.id }
                );
            }
        } catch(e) {
            console.error("Cron Job: Error", e);
        }
    });

    console.log("Cron jobs initialized");
};

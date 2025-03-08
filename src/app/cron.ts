import dayjs from "dayjs";
import cron from "node-cron";

import { DataSource } from "typeorm";
import { CalendarService } from "../services/calendar.service.js";
import { NotificationService } from "../services/notification.service.js";
import { NotificationType } from "../types/enums.js";
import { UserService } from "../services/user.service.js";
import { SyncService } from "../services/sync.service.js";
export function initCronJobs(ds: DataSource) {
    const usr = new UserService(ds);
    const calen = new CalendarService(ds, usr);
    const noti = new NotificationService(ds);
    const sync = new SyncService(ds, { calendarService: calen, userService: usr });

    cron.schedule("*/10 * * * * *", async () => {
        const now = new Date();
        const tenSec = dayjs(now).add(10, "seconds").toDate();
        console.log("Event Reminder: Time", new Date().toISOString());
        try {
            const events = await calen.getNotifiableEvents(now, tenSec);
            await Promise.all(
                events.map(async event => {
                    await noti.notifyByUsers(
                        [event.owner], 
                        NotificationType.EVENT_REMINDER, 
                        { eventId: event.id, eventTitle: event.title }
                    );
                    await noti.notifyFirebaseByUsers(
                        [event.owner], 
                        NotificationType.EVENT_REMINDER, 
                        { eventId: event.id, eventTitle: event.title }
                    )
                })
            );
        } catch(e) {
            console.error("Event Reminder: Error", e);
        }
    });

    cron.schedule("0 * * * *", async () => {
        console.log("Sync Calendar: Time", new Date().toISOString());
        try {
            const users = await usr.getAllUsers();
            await Promise.all(
                users.map(async user => {
                    await sync.syncUserEvents(user.id);
                })
            );
        } catch(e) {
            console.error("Sync Calendar: Error", e);
        }
    });

    // run every month and when app startup
    cron.schedule("0 0 1 * *", async () => {
        console.log("Sync Global Events: Time", new Date().toISOString());
        try {
            await sync.syncGlobalEvents();
        } catch(e) {
            console.error("Sync Global Events: Error", e);
        }
    });

    console.log("Cron jobs initialized");
};

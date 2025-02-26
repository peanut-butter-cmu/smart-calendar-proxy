import { DataSource } from "typeorm";
import { CalendarService } from "./calendar.service.js";
import { NotificationService } from "./notification.service.js";
import { SharedCalendarService } from "./sharedCalendar.service.js";
import { UserService } from "./user.service.js";

export type Services = {
    calendar: CalendarService,
    sharedCalendar: SharedCalendarService,
    notification: NotificationService,
    user: UserService
};

export function createServices(ds: DataSource): Services {
    return {
        calendar: new CalendarService(ds),
        sharedCalendar: new SharedCalendarService(ds),
        notification: new NotificationService(ds),
        user: new UserService(ds)
    }
}

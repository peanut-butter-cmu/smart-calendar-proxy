import { CalendarEvent } from "../models/calendarEvent.entity.js";
import { SharedEvent } from "../models/sharedEvent.entity.js";
import { CalendarEventGroup } from "../models/calendarEventGroup.entity.js";
import { User } from "../models/user.entity.js";
import * as swagger from "../types/swagger.js";
import { JWTPayload, Pagination } from "../types/global.js";
import { Notification } from "../models/notification.entity.js";
import { CalendarEventType, NotificationType } from "../types/enums.js";

function undefArr<T>(arr: T[] | null | undefined) { // sometimes undef arr not handled by TS.
    return arr || [];
}

export function fCalendarEventType(type: CalendarEventType): swagger.CalendarEventType {
    return {
        [CalendarEventType.NON_SHARED]: swagger.CalendarEventType.NON_SHARED,
        [CalendarEventType.SAVED_SHARED]: swagger.CalendarEventType.SAVED_SHARED,
        [CalendarEventType.UNSAVED_SHARED]: swagger.CalendarEventType.UNSAVED_SHARED,
    }[type];
}

export function fCalendarEvent(event: CalendarEvent): swagger.CalendarEvent {
    return {
        id: event.id,
        title: event.title,
        type: fCalendarEventType(event.type),
        groups: undefArr(event.groups).map(({ id }) => id),
        start: event.start,
        end: event.end,
    };
}

export function fSharedCalendarEvent(event: CalendarEvent): swagger.SharedCalendarEvent {
    return {
        id: event.id,
        title: event.title,
        type: fCalendarEventType(event.type),
        start: event.start,
        end: event.end,
    };
}

export function fEventGroup(group: CalendarEventGroup): swagger.EventGroup {
    return {
        id: group.id,
        title: group.title,
        type: group.type,
        color: group.color,
        priority: group.priority,
        isBusy: group.isBusy,
        reminders: group.reminders
    };
}

export function fIdealTimeRange(event: { 
    startDate: Date;
    endDate: Date; 
    dailyStartMin: number;
    dailyEndMin: number;
}) {
    return {
        startDate: event.startDate,
        endDate: event.endDate,
        dailyStartMin: event.dailyStartMin,
        dailyEndMin: event.dailyEndMin,
    }
}

export function fRepeat(repeat?: {
    type: "week" | "month",
    count: number
}) {
    return repeat ? {
        type: repeat.type,
        count: repeat.count
    } : undefined;
}

export function fSharedEvent(event: SharedEvent): swagger.SharedEvent {
    return {
        id: event.id,
        title: event.title,
        status: event.status,
        duration: event.duration,
        reminders: event.reminders,
        idealDays: event.idealDays,
        idealTimeRange: fIdealTimeRange(event.idealTimeRange),
        members: undefArr(event.members).map(member => ({
            givenName: member.givenName,
            middleName: member.middleName,
            familyName: member.familyName,
            sharedEventOwner: member.id === event.owner.id,
            events: undefArr(event.events)
                    .filter(event => event.owner.id === member.id)
                    .map(fSharedCalendarEvent),
        })),
        invites: undefArr(event.invites).map(invite => ({
            email: invite.email,
            status: invite.status,
            updatedAt: invite.updatedAt,
            createdAt: invite.createdAt
        })),
        repeat: fRepeat(event.repeat),
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
    };
}

export function fJWTPayload(user: User): JWTPayload {
    return {
        id: user.id
    };
}

export function fUser(user: User): swagger.User {
    return {
        firstName: user.givenName,
        middleName: user.middleName,
        lastName: user.familyName,
        studentNo: user.studentNo
    };
}

export function fNotificationData({ type, data }: Notification): { 
    type: swagger.NotificationType.EVENT_CREATED | swagger.NotificationType.EVENT_SCHEDULED | 
          swagger.NotificationType.EVENT_DELETED | swagger.NotificationType.EVENT_REMINDER,
    data: { eventId: number, eventTitle: string }
 } | { 
    type: swagger.NotificationType.INVITE_ACCEPTED | swagger.NotificationType.INVITE_REJECTED, 
    data: { email: string } 
} {
    if (type === NotificationType.EVENT_CREATED)
        return { type: swagger.NotificationType.EVENT_CREATED, data: { eventId: data.eventId, eventTitle: data.eventTitle } };
    else if (type === NotificationType.MEETING_SCHEDULED)
        return { type: swagger.NotificationType.EVENT_SCHEDULED, data: { eventId: data.eventId, eventTitle: data.eventTitle } };
    else if (type === NotificationType.EVENT_DELETED)
        return { type: swagger.NotificationType.EVENT_DELETED, data: { eventId: data.eventId, eventTitle: data.eventTitle } };
    else if (type === NotificationType.EVENT_REMINDER)
        return { type: swagger.NotificationType.EVENT_REMINDER, data: { eventId: data.eventId, eventTitle: data.eventTitle } };
    else if (type === NotificationType.INVITE_ACCEPTED)
        return { type: swagger.NotificationType.INVITE_ACCEPTED, data: { email: data.email } };
    else if (type === NotificationType.INVITE_REJECTED)
        return { type: swagger.NotificationType.INVITE_REJECTED, data: { email: data.email } };
}

export function fNotification(notification: Notification): swagger.Notification {
    return {
        id: notification.id,
        ...fNotificationData(notification),
        read: notification.read,
        createdAt: notification.createdAt,
    };
}

export function fCMUUsername(CMUMail: string): string {
    return CMUMail.replace("@cmu.ac.th", "");
}

export function fCMUEmail(CMUUsername: string): string {
    return `${CMUUsername}@cmu.ac.th`;
}

export function fSharedEventPagination(
    pagination: Pagination<SharedEvent>
): swagger.Pagination<swagger.SharedEvent> {
    const result = {
        sharedEvents: pagination.items.map(fSharedEvent),
        pagination: {
            total: pagination.total,
            offset: pagination.offset,
            limit: pagination.limit
        }
    };
    return result;
}

export function fCalendarEventPagination(
    pagination: Pagination<CalendarEvent>
): swagger.Pagination<swagger.CalendarEvent> {
    return {
        calendar: pagination.items.map(fCalendarEvent),
        pagination: {
            total: pagination.total,
            offset: pagination.offset,
            limit: pagination.limit
        }
    };
}

/**
 * Extract the first 6 course code from course name
 * @param courseName - The name of the course
 * @returns The first 6 course no.
 * @throws If the course name does not contain a valid course code
 */
export function fMangoCourseID(courseName: string): string {
    const match = courseName.match(/^\d{6}/);
    if (!match)
        throw new Error("Invalid course name.");
    return match[0];
}
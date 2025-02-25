import { CalendarEvent } from "../models/CalendarEvent.entity.js";
import { SharedEvent } from "../models/SharedEvent.entity.js";
import { CalendarEventGroup } from "../models/EventGroup.entity.js";
import { User } from "../models/User.entity.js";
import * as swagger from "../types/swagger.js";
import { JWTPayload } from "../types/global.js";
import { Notification, NotificationType } from "../models/Notification.entity.js";

export function fCalendarEvent(event: CalendarEvent): swagger.CalendarEvent {
    return {
        id: event.id,
        title: event.title,
        groups: event.groups.map(({ id }) => id),
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
    type: "weekly" | "monthly",
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
        members: event.members?.map(member => ({
            givenName: member.givenName,
            middleName: member.middleName,
            familyName: member.familyName,
            owner: member.id === event.owner.id
        })) || [],
        invites: event.invites?.map(invite => ({
            email: invite.email,
            status: invite.status,
            updatedAt: invite.updatedAt,
            createdAt: invite.createdAt
        })) || [],
        events: event.events?.map(fCalendarEvent) || [],
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
    data: { eventId: number }
 } | { 
    type: swagger.NotificationType.INVITE_ACCEPTED | swagger.NotificationType.INVITE_REJECTED, 
    data: { email: string } 
} {
    if (type === NotificationType.EVENT_CREATED)
        return { type: swagger.NotificationType.EVENT_CREATED, data: { eventId: data.eventId } };
    else if (type === NotificationType.MEETING_SCHEDULED)
        return { type: swagger.NotificationType.EVENT_SCHEDULED, data: { eventId: data.eventId } };
    else if (type === NotificationType.EVENT_DELETED)
        return { type: swagger.NotificationType.EVENT_DELETED, data: { eventId: data.eventId } };
    else if (type === NotificationType.EVENT_REMINDER)
        return { type: swagger.NotificationType.EVENT_REMINDER, data: { eventId: data.eventId } };
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

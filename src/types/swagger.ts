import { EventGroupType } from "../models/EventGroup.entity.js";
import { SharedEventStatus } from "../models/SharedEvent.entity.js";
import { InviteStatus } from "../models/SharedEventInvite.entity.js";

export type PaginationKey<T> = 
    T extends CalendarEvent ? "calendar" : 
    T extends SharedEvent ? "sharedEvents" : 
    T extends Notification ? "notifications" : never;

export type Pagination<T, U extends string = PaginationKey<T>> = {
    [key in U]: T[];
} & {
    pagination: {
        total: number;
        limit: number;
        offset: number;
    }
};

export type PaginationRequest = {
    limit?: string;
    offset?: string;
};

export type CalendarEvent = {
    id: number;
    title: string;
    start: Date;
    end: Date;
    groups: number[];
};

export type CalendarEventNew = {
    title: string;
    start: Date;
    end: Date;
    groups: number[];
};

export type CalendarEventEdit = Partial<{
    title: string;
    start: Date;
    end: Date;
}>;

export type EventGroup = {
    id: number;
    title: string;
    type: EventGroupType;
    color: string;
    priority: number;
    isBusy: boolean;
    reminders: number[];
};

export type EventGroupEdit = Partial<{
    title: string;
    type: EventGroupType;
    color: string;
    priority: number;
    isBusy: boolean;
    reminders: number[];
}>;

export type SharedEvent = {
    id: number;
    title: string;
    status: SharedEventStatus;
    duration: number;
    reminders: number[];
    idealDays: number[];
    idealTimeRange: {
        startDate: Date;
        endDate: Date;
        dailyStartMin: number;
        dailyEndMin: number;
    };
    members: {
        givenName: string;
        middleName: string | null;
        familyName: string;
        owner: boolean;
    }[];
    invites: {
        email: string;
        status: InviteStatus;
        updatedAt: Date;
        createdAt: Date;
    }[];
    events: CalendarEvent[];
    repeat?: {
        type: "weekly" | "monthly";
        count: number;
    }
    createdAt: Date;
    updatedAt: Date;
};

export type SharedEventNew = {
    title: string;
    status: SharedEventStatus;
    duration: number;
    reminders: number[];
    idealDays: number[];
    idealTimeRange: { 
        startDate: Date; 
        endDate: Date; 
        dailyStartMin: number; 
        dailyEndMin: number 
    };
    members: {
        givenName: string;
        middleName: string | null;
        familyName: string;
        owner: boolean;
    }[];
    invites: string[];
    events: CalendarEvent[];
    repeat?: {
        type: "weekly" | "monthly",
        count: number
    };
};

export type SharedEventEdit = Partial<{
    title: string;
    status: SharedEventStatus;
    duration: number;
    reminders: number[];
    idealDays: number[];
    idealTimeRange: { 
        startDate: Date; 
        endDate: Date; 
        dailyStartMin: number; 
        dailyEndMin: number 
    };
    invites: string[];
    repeat?: {
        type: "weekly" | "monthly",
        count: number
    };
}>;

export type JWT = string;

export type User = {
    firstName: string;
    middleName: string;
    lastName: string;
    studentNo: number;
};

export enum NotificationType {
    EVENT_CREATED = "event_created",
    EVENT_SCHEDULED = "event_scheduled",
    EVENT_DELETED = "event_deleted",
    INVITE_ACCEPTED = "invite_accepted",
    INVITE_REJECTED = "invite_rejected",
    EVENT_REMINDER = "event_reminder"
};

export type Notification = {
    id: number;
    read: boolean;
    createdAt: Date;
} & (
    | { type: NotificationType.EVENT_CREATED, data: { eventId: number } }
    | { type: NotificationType.EVENT_SCHEDULED, data: { eventId: number } }
    | { type: NotificationType.EVENT_DELETED, data: { eventId: number } }
    | { type: NotificationType.EVENT_REMINDER, data: { eventId: number } }
    | { type: NotificationType.INVITE_ACCEPTED, data: { email: string } }
    | { type: NotificationType.INVITE_REJECTED, data: { email: string } }
);

export type Error = {
    message: string;
};

export type FCMToken = {
    id: number;
    deviceName: string;
    createdAt: Date;
};

export type FCMTokenNew = {
    token: string;
    deviceName: string;
};

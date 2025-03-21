import { EventGroupType } from "./enums.js";
import { SharedEventStatus } from "./enums.js";
import { InviteStatus } from "./enums.js";

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

export enum CalendarEventType {
    NON_SHARED = "non_shared",
    UNSAVED_SHARED = "unsaved_shared",
    SAVED_SHARED = "saved_shared"
};

export type CalendarEvent = {
    id: number;
    title: string;
    type: CalendarEventType,
    start: Date;
    end: Date;
    groups: number[];
};

export type SharedCalendarEvent = {
    id: number;
    title: string;
    type: CalendarEventType,
    start: Date;
    end: Date;
};

export type CalendarEventNew = {
    title: string;
    start: Date;
    end: Date;
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
        firstName: string;
        middleName: string | null;
        lastName: string;
        sharedEventOwner: boolean;
        events: SharedCalendarEvent[];
    }[];
    invites: {
        email: string;
        status: InviteStatus;
        updatedAt: Date;
        createdAt: Date;
    }[];
    repeat?: {
        type: "week" | "month";
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
        firstName: string;
        middleName: string | null;
        lastName: string;
        owner: boolean;
    }[];
    invites: string[];
    events: CalendarEvent[];
    repeat?: {
        type: "week" | "monthly",
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
        type: "week" | "month",
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
    | { type: NotificationType.EVENT_CREATED, data: { eventId: number, eventTitle: string } }
    | { type: NotificationType.EVENT_SCHEDULED, data: { eventId: number, eventTitle: string } }
    | { type: NotificationType.EVENT_DELETED, data: { eventId: number, eventTitle: string } }
    | { type: NotificationType.EVENT_REMINDER, data: { eventId: number, eventTitle: string } }
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

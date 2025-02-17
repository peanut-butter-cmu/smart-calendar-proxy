import { CalendarEvent } from "../models/calendarEvent.entity.js";
import { SharedEvent, SharedEventStatus } from "../models/sharedEvent.entity.js";
import { InviteStatus } from "../models/sharedEventInvite.entity.js";
import { CalendarEventGroup } from "../models/calendarEventGroup.entity.js";

export type CalendarEventResp = Omit<CalendarEvent, "owner" | "groups" | "created" | "modified"> & {
    groups: number[];
};

export type EventGroupResp = Omit<CalendarEventGroup, "owner" | "readonly" | "created" | "modified" | "events">;

export type SharedEventResp = {
    id: number;
    title: string;
    status: SharedEventStatus;
    duration: number;
    reminders: number[];
    idealDays: number[];
    idealTimeRange: { start: string, end: string };
    members: {
        givenName: string;
        middleName: string | null;
        familyName: string;
        owner: Boolean;
    }[];
    invites: {
        email: string;
        status: InviteStatus;
        updatedAt: Date;
        createdAt: Date;
    }[];
    events: CalendarEventResp[];
    createdAt: Date;
    updatedAt: Date;
};

export function transformEventResp(event: CalendarEvent | null): CalendarEventResp | null {
    if (!event)
        return null;
    return {
        id: event.id,
        title: event.title,
        groups: event.groups.map(({id}) => id),
        start: event.start,
        end: event.end,
    };
}

export function transformGroupResp(group: CalendarEventGroup | null): EventGroupResp | null {
    if (!group)
        return null;
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

export function transformSharedEventResp(userId: number, event: SharedEvent | null): SharedEventResp | null {
    if (!event)
        return null;
    return {
        id: event.id,
        title: event.title,
        status: event.status,
        duration: event.duration,
        reminders: event.reminders,
        idealDays: event.idealDays,
        idealTimeRange: event.idealTimeRange,
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
        events: event.events?.map(transformEventResp) || [],
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
    };
}

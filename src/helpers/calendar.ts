import { Priority, GroupTitle } from "../types/enums.js";
import dayjs from "dayjs";
import { CalendarEvent } from "../models/calendarEvent.entity.js";

export function createStartEndInRegDate(date: Date, startSec: number, endSec: number) {  
    function addBy(sec: number) {
        return dayjs(date).add(sec, "s").toDate();
    }
    return {
        start: addBy(startSec),
        end: addBy(endSec)
    }
}

export function getDefaultColor(title: GroupTitle | string) {
    switch (title) {
        case GroupTitle.ASSIGNMENT:
            return "rgb(252, 205, 42)";
        case GroupTitle.CLASS:
            return "rgb(65, 179, 162)";
        case GroupTitle.CMU:
            return "rgb(97, 94, 252)";
        case GroupTitle.FINAL:
            return "rgb(255, 0, 0)";
        case GroupTitle.MIDTERM:
            return "rgb(255, 0, 0)";
        case GroupTitle.HOLIDAY:
            return "rgb(120, 134, 199)";
        case GroupTitle.OWNER:
            return "rgb(154, 126, 111)";
        case GroupTitle.QUIZ:
            return "rgb(255, 145, 0)";
    }
}

export function getDefaultPriority(title: GroupTitle) {
    switch(title) {
        case GroupTitle.ASSIGNMENT:
            return Priority.MEDIUM;
        case GroupTitle.CLASS:
            return Priority.MEDIUM;
        case GroupTitle.CMU:
            return Priority.MEDIUM;
        case GroupTitle.FINAL:
            return Priority.MEDIUM;
        case GroupTitle.HOLIDAY:
            return Priority.MEDIUM;
        case GroupTitle.MIDTERM:
            return Priority.MEDIUM;
        case GroupTitle.OWNER:
            return Priority.MEDIUM;
        case GroupTitle.QUIZ:
            return Priority.MEDIUM;
    }
}

export function getDefaultBusy(title: GroupTitle) {
    switch(title) {
        case GroupTitle.ASSIGNMENT:
            return true;
        case GroupTitle.CLASS:
            return true;
        case GroupTitle.CMU:
            return false;
        case GroupTitle.FINAL:
            return true;
        case GroupTitle.HOLIDAY:
            return false;
        case GroupTitle.MIDTERM:
            return true;
        case GroupTitle.OWNER:
            return true;
        case GroupTitle.QUIZ:
            return true;
    }
}

export function getDefaultReminders(title: GroupTitle) {
    switch(title) {
        case GroupTitle.ASSIGNMENT:
            return [0, 30];
        case GroupTitle.CLASS:
            return [15];
        case GroupTitle.CMU:
            return [];
        case GroupTitle.FINAL:
            return [30];
        case GroupTitle.HOLIDAY:
            return [];
        case GroupTitle.MIDTERM:
            return [30];
        case GroupTitle.OWNER:
            return [0];
        case GroupTitle.QUIZ:
            return [30];
    }
}

type TimeSlot = {
    start: Date;
    end: Date;
};

export function findFreeTimeSlots(
    date: Date,
    dailyStartMin: number,
    dailyEndMin: number,
    duration: number,
    busyEvents: CalendarEvent[]
): TimeSlot {
    if (dailyStartMin >= dailyEndMin)
        throw new Error("`dailyEndMin` must not greater or equals `dailyStartMin`.");
    if (dailyEndMin - dailyStartMin < duration)
        throw new Error("`duration` is impossible.");
    const freeMinutes: boolean[] = Array(1_440)
        .fill(true)
        .map((v, idx) => v && idx >= dailyStartMin)
        .map((v, idx) => v && idx <= dailyEndMin);
    const startOfDay = dayjs(date).startOf("day");

    // Mark busy minutes in freeMinutes array
    const dayEvents = busyEvents.filter(event => 
        dayjs(event.start).isSame(date, "day") || 
        dayjs(event.end).isSame(date, "day")
    );

    for (const event of dayEvents) {
        const eventStart = dayjs(event.start);
        const eventEnd = dayjs(event.end);
        const startMin = eventStart.hour() * 60 + eventStart.minute();
        const endMin = eventEnd.hour() * 60 + eventEnd.minute();
        for (let min = startMin; min < endMin; min++)
            freeMinutes[min] = false;
    }

    let currentSlotStart = -1;
    for (let min = 0; min < freeMinutes.length; min++) {
        if (freeMinutes[min]) {
            if (currentSlotStart === -1)
                currentSlotStart = min;
            if (min - currentSlotStart + 1 >= duration)
                return {
                    start: startOfDay.add(currentSlotStart, "minute").toDate(),
                    end: startOfDay.add(min + 1, "minute").toDate()
                };
        } else {
            currentSlotStart = -1;
        }
    }
}

export function findTimeSlotInRange(
    params: {
        startDate: Date,
        endDate: Date,
        dailyStartMin: number,
        dailyEndMin: number,
        duration: number,
        idealDays: number[],
        busyEvents: CalendarEvent[],
        repeat?: {
            type: "week" | "month",
            count: number
        }
    }
): TimeSlot[] {
    let start = dayjs(params.startDate);
    let end = dayjs(params.endDate);
    const timeSlots = [];
    let repeatCount = params.repeat?.count || 0;
    for (let date = dayjs(params.startDate); date.isBefore(end) || date.isSame(end, "day"); date = date.add(1, "day")) {
        if (!params.idealDays.includes(date.day()))
            continue;
        const timeSlot = findFreeTimeSlots(
            date.toDate(),
            params.dailyStartMin,
            params.dailyEndMin,
            params.duration,
            params.busyEvents
        );
        if (!timeSlot)
            continue;
        timeSlots.push(timeSlot);
        if (repeatCount > 0) {
            start = start.add(1, params.repeat.type);
            date = start;
            end = end.add(1, params.repeat.type);
            repeatCount--;
        } else {
            break;
        }
    }
    if (timeSlots.length !== (params.repeat?.count || 0) + 1)
        throw new Error("Unable to arange an event in specific time period.")
    return timeSlots;
}

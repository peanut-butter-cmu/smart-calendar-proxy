import { findTimeSlotInRange } from "./calendar.js";
import { CalendarEvent } from "../models/calendarEvent.entity.js";
import { CalendarEventType } from "../types/enums.js";
import dayjs from "dayjs";

describe("findTimeSlotInRange", () => {
    const baseDate = new Date("2024-03-20T00:00:00.000Z"); // Wednesday
    
    // Mock busy events
    const busyEvents: CalendarEvent[] = [
        {
            id: 1,
            title: "Busy Event 1",
            type: CalendarEventType.NON_SHARED,
            start: dayjs(baseDate).hour(10).minute(0).toDate(), // 10:00 AM
            end: dayjs(baseDate).hour(11).minute(0).toDate(),   // 11:00 AM
            created: new Date(),
            modified: new Date(),
            groups: [],
            owner: null
        } as CalendarEvent
    ];

    it("should find a single time slot on a specific day", () => {
        const result = findTimeSlotInRange({
            startDate: baseDate,
            endDate: baseDate,
            dailyStartMin: 9 * 60,  // 9:00 AM
            dailyEndMin: 17 * 60,   // 5:00 PM
            duration: 60,           // 1 hour
            idealDays: [3],         // Wednesday
            busyEvents: busyEvents
        });

        expect(result).toHaveLength(1);
        expect(dayjs(result[0].start).hour()).toBe(9); // Should find slot at 9:00 AM
        expect(dayjs(result[0].end).hour()).toBe(10);
    });

    it("should handle weekly repeating events", () => {
        const result = findTimeSlotInRange({
            startDate: baseDate,
            endDate: dayjs(baseDate).add(2, "week").toDate(),
            dailyStartMin: 9 * 60,
            dailyEndMin: 17 * 60,
            duration: 60,
            idealDays: [3],
            busyEvents: busyEvents,
            repeat: {
                type: "week",
                count: 2
            }
        });

        expect(result).toHaveLength(3);
        // Check if dates are one week apart
        expect(dayjs(result[1].start).diff(result[0].start, "week")).toBe(1);
        expect(dayjs(result[2].start).diff(result[1].start, "week")).toBe(1);
    });

    it("should throw error when no slots available", () => {
        const fullDayBusy: CalendarEvent[] = [
            {
                id: 2,
                title: "All Day Event",
                type: CalendarEventType.NON_SHARED,
                start: dayjs(baseDate).hour(9).minute(0).toDate(),
                end: dayjs(baseDate).hour(17).minute(0).toDate(),
                created: new Date(),
                modified: new Date(),
                groups: [],
                owner: null
            } as CalendarEvent
        ];

        expect(() => findTimeSlotInRange({
            startDate: baseDate,
            endDate: baseDate,
            dailyStartMin: 9 * 60,
            dailyEndMin: 17 * 60,
            duration: 60,
            idealDays: [3],
            busyEvents: fullDayBusy
        })).toThrow("Unable to arange an event in specific time period.");
    });

    it("should skip non-ideal days", () => {
        const result = findTimeSlotInRange({
            startDate: baseDate,
            endDate: dayjs(baseDate).add(2, "day").toDate(),
            dailyStartMin: 9 * 60,
            dailyEndMin: 17 * 60,
            duration: 60,
            idealDays: [4], // Only Thursday
            busyEvents: busyEvents
        });

        expect(result).toHaveLength(1);
        expect(dayjs(result[0].start).day()).toBe(4); // Should be Thursday
    });

    it("should handle monthly repeating events", () => {
        const result = findTimeSlotInRange({
            startDate: baseDate,
            endDate: dayjs(baseDate).add(2, "month").toDate(),
            dailyStartMin: 9 * 60,
            dailyEndMin: 17 * 60,
            duration: 60,
            idealDays: [3],
            busyEvents: busyEvents,
            repeat: {
                type: "month",
                count: 2
            }
        });

        expect(result).toHaveLength(3);
        // Check if dates are one month apart
        expect(dayjs(result[1].start).diff(result[0].start, "month")).toBe(1);
        expect(dayjs(result[2].start).diff(result[1].start, "month")).toBe(1);
    });
}); 
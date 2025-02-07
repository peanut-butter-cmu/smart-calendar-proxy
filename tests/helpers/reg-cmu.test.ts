import { formatExamDate, courseScheduleDates, formatStartEndSec } from "@/helpers/reg-cmu.js";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

dayjs.extend(customParseFormat);
describe("testing courseScheduleDates", () => {
    const wk = { start: new Date("2025-01-13"), end: new Date("2025-01-19") };
    test("test on empty string", () => {
        const intervals = courseScheduleDates("", "0900-1000", wk);
        expect(intervals).toEqual([]);
    });

    test("test on -", () => {
        const intervals = courseScheduleDates("-", "0900-1000", wk);
        expect(intervals).toEqual([]);
    });

    test("test with Su, 0900-1000", () => {
        const intervals = courseScheduleDates("Su", "0900-1000", wk);
        expect(intervals).toEqual([
            { start: new Date("2025-01-19 09:00:00"), end: new Date("2025-01-19 10:00:00") }
        ]);
    });

    test("test with Mo, 0900-1000", () => {
        const intervals = courseScheduleDates("Mo", "0900-1000", wk);
        expect(intervals).toEqual([
            { start: new Date("2025-01-13 09:00:00"), end: new Date("2025-01-13 10:00:00") }
        ]);
    });

    test("test with Tu, 0900-1000", () => {
        const intervals = courseScheduleDates("Tu", "0900-1000", wk);
        expect(intervals).toEqual([
            { start: new Date("2025-01-14 09:00:00"), end: new Date("2025-01-14 10:00:00") }
        ]);
    });

    test("test with We, 0900-1000", () => {
        const intervals = courseScheduleDates("We", "0900-1000", wk);
        expect(intervals).toEqual([
            { start: new Date("2025-01-15 09:00:00"), end: new Date("2025-01-15 10:00:00") }
        ]);
    });

    test("test with Th, 0900-1000", () => {
        const intervals = courseScheduleDates("Th", "0900-1000", wk);
        expect(intervals).toEqual([
            { start: new Date("2025-01-16 09:00:00"), end: new Date("2025-01-16 10:00:00") }
        ]);
    });

    test("test with Fr, 0900-1000", () => {
        const intervals = courseScheduleDates("Fr", "0900-1000", wk);
        expect(intervals).toEqual([
            { start: new Date("2025-01-17 09:00:00"), end: new Date("2025-01-17 10:00:00") }
        ]);
    });

    test("test with Sa, 0900-1000", () => {
        const intervals = courseScheduleDates("Sa", "0900-1000", wk);
        expect(intervals).toEqual([
            { start: new Date("2025-01-18 09:00:00"), end: new Date("2025-01-18 10:00:00") }
        ]);
    });

    test("test with MTh, 0900-1000", () => {
        const intervals = courseScheduleDates("MTh", "0900-1000", wk);
        expect(intervals).toEqual([
            { start: new Date("2025-01-13 09:00:00"), end: new Date("2025-01-13 10:00:00") },
            { start: new Date("2025-01-16 09:00:00"), end: new Date("2025-01-16 10:00:00") }
        ]);
    });

    test("test with TT, 0900-1000", () => {
        const intervals = courseScheduleDates("TT", "0900-1000", wk);
        expect(intervals).toEqual([
            { start: new Date("2025-01-14 09:00:00"), end: new Date("2025-01-14 10:00:00") },
            { start: new Date("2025-01-16 09:00:00"), end: new Date("2025-01-16 10:00:00") }
        ]);
    });

    test("test with MTT, 0900-1000", () => {
        const intervals = courseScheduleDates("MTT", "0900-1000", wk);
        expect(intervals).toEqual([
            { start: new Date("2025-01-13 09:00:00"), end: new Date("2025-01-13 10:00:00") },
            { start: new Date("2025-01-14 09:00:00"), end: new Date("2025-01-14 10:00:00") },
            { start: new Date("2025-01-16 09:00:00"), end: new Date("2025-01-16 10:00:00") }
        ]);
    });

    test("test with TBA, 0900-1000", () => {
        const intervals = courseScheduleDates("TBA", "0900-1000", wk);
        expect(intervals).toEqual([]);
    });

    test("test with MWF, 0900-1000", () => {
        const intervals = courseScheduleDates("MWF", "0900-1000", wk);
        expect(intervals).toEqual([
            { start: new Date("2025-01-13 09:00:00"), end: new Date("2025-01-13 10:00:00") },
            { start: new Date("2025-01-15 09:00:00"), end: new Date("2025-01-15 10:00:00") },
            { start: new Date("2025-01-17 09:00:00"), end: new Date("2025-01-17 10:00:00") }
        ]);
    });

    test("test with M-F, 0900-1000", () => {
        const intervals = courseScheduleDates("M-F", "0900-1000", wk);
        expect(intervals).toEqual([
            { start: new Date("2025-01-13 09:00:00"), end: new Date("2025-01-13 10:00:00") },
            { start: new Date("2025-01-14 09:00:00"), end: new Date("2025-01-14 10:00:00") },
            { start: new Date("2025-01-15 09:00:00"), end: new Date("2025-01-15 10:00:00") },
            { start: new Date("2025-01-16 09:00:00"), end: new Date("2025-01-16 10:00:00") },
            { start: new Date("2025-01-17 09:00:00"), end: new Date("2025-01-17 10:00:00") }
        ]);
    });

    test("test with M-Sa, 0900-1000", () => {
        const intervals = courseScheduleDates("M-Sa", "0900-1000", wk);
        expect(intervals).toEqual([
            { start: new Date("2025-01-13 09:00:00"), end: new Date("2025-01-13 10:00:00") },
            { start: new Date("2025-01-14 09:00:00"), end: new Date("2025-01-14 10:00:00") },
            { start: new Date("2025-01-15 09:00:00"), end: new Date("2025-01-15 10:00:00") },
            { start: new Date("2025-01-16 09:00:00"), end: new Date("2025-01-16 10:00:00") },
            { start: new Date("2025-01-17 09:00:00"), end: new Date("2025-01-17 10:00:00") },
            { start: new Date("2025-01-18 09:00:00"), end: new Date("2025-01-18 10:00:00") }
        ]);
    });
    
    test("test with M-Su, 0900-1000", () => {
        const intervals = courseScheduleDates("M-Su", "0900-1000", wk);
        expect(intervals).toEqual([
            { start: new Date("2025-01-13 09:00:00"), end: new Date("2025-01-13 10:00:00") },
            { start: new Date("2025-01-14 09:00:00"), end: new Date("2025-01-14 10:00:00") },
            { start: new Date("2025-01-15 09:00:00"), end: new Date("2025-01-15 10:00:00") },
            { start: new Date("2025-01-16 09:00:00"), end: new Date("2025-01-16 10:00:00") },
            { start: new Date("2025-01-17 09:00:00"), end: new Date("2025-01-17 10:00:00") },
            { start: new Date("2025-01-18 09:00:00"), end: new Date("2025-01-18 10:00:00") },
            { start: new Date("2025-01-19 09:00:00"), end: new Date("2025-01-19 10:00:00") }
        ]);
    });
});

describe("testing formatStartEndSec", () => {
    test("test on '0000-0000'", () => {
        expect(formatStartEndSec("0000-0000"))
            .toEqual({ start: 0, end: 0 });
    });

    test("test on '0001-0010'", () => {
        expect(formatStartEndSec("0001-0010"))
            .toEqual({ start: 60, end: 600 });
    });

    test("test on '0010-0001'", () => {
        expect(formatStartEndSec("0010-0001"))
            .toEqual({ start: 600, end: 60 });
    });

    test("test on '0010-0101'", () => {
        expect(formatStartEndSec("0010-0101"))
            .toEqual({ start: 600, end: 3660 });
    });

    test("test on '0101-1201'", () => {
        expect(formatStartEndSec("0101-1201"))
            .toEqual({ start: 3660, end: 43260 });
    });

    test("test on '0000-2359'", () => {
        expect(formatStartEndSec("0000-2359"))
            .toEqual({ start: 0, end: 86340 });
    });
});

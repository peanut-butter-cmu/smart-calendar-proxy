import { courseScheduleDates } from "../../src/helpers/reg-cmu.js";

describe("testing courseScheduleDates", () => {
    test("test on empty string", () => {
        const intervals = courseScheduleDates("", "", { start: new Date, end: new Date });
        expect(intervals).toEqual([]);
    });

    test("test with MTh, 0900-1000", () => {
        const wk = { start: new Date("2025-01-13"), end: new Date("2025-01-19") };
        const intervals = courseScheduleDates("MTh", "0900-1000", wk);
        expect(intervals).toEqual([
            { start: new Date("2025-01-13 09:00:00"), end: new Date("2025-01-13 10:00:00") },
            { start: new Date("2025-01-16 09:00:00"), end: new Date("2025-01-16 10:00:00") }
        ]);
    });
});
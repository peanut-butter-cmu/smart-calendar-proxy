import { eachDayOfInterval } from "date-fns";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

function convertWeekdays(shortDays: string) {
    const map = new Map(Object.entries({ M: 1, Tu: 2, W: 3, Th: 4, F: 5 }));
    const regex = /M|Tu|W|Th|F|Sa|Su/g;
    const matches = shortDays.match(regex);
    return matches ? matches.map(day => map.get(day)).filter(day => day !== undefined) : [];
}

export function courseScheduleDates(schedule_day: string, schedule_time: string, semester: { start: Date, end: Date }): { start: Date, end: Date }[] {
    dayjs.extend(customParseFormat);
    const days = convertWeekdays(schedule_day);
    const [ start, end ] = schedule_time.split('-').map(time => dayjs(time, "HHmm"));
    function setHMS(input: Date, hms: Dayjs): Date {
        return dayjs(input)
            .set("h", hms.hour())
            .set("m", hms.minute())
            .set("s", hms.second())
            .toDate();
    }
    return eachDayOfInterval(semester)
        .filter(date => days.includes(date.getDay()))
        .map(date => ({ start: setHMS(date, start), end: setHMS(date, end) }));
}
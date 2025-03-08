import dayjs from "dayjs";
import { VCalendar } from "ts-ics";

export function promptGlobalEvents(calendar: VCalendar) {
    return `
    Please reformat the following event titles to be more concise and easy to understand.
    Retain other fields as is. Please return the result in JSON format without any code block.
    """json
    ${
        JSON.stringify({
            events: calendar.events?.map(e => ({
                uid: e.uid,
                title: e.summary,
                start: e.start.date,
                end: dayjs(e.end.date).subtract(1, "day").toDate(),
            }))
        })
    }
    """
    `;
}


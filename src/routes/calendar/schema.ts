import { ReminderOptions } from "../../models/calendarEventGroup.entity.js";
import { checkSchema } from "express-validator";

const eventSchema = checkSchema({
    title: {
        in: "body",
        isString: true,
        isLength: {
            options: { min: 1, max: 32 }
        }
    },
    start: {
        in: "body",
        isISO8601: true
    },
    end: {
        in: "body",
        isISO8601: true
    }
});

const eventEditSchema = checkSchema({
    title: {
        in: "body",
        optional: true,
        isString: true,
        isLength: {
            options: { min: 1, max: 32 }
        },
    },
    start: {
        in: "body",
        optional: true,
        isISO8601: true,
    },
    end: {
        in: "body",
        optional: true,
        isISO8601: true,
    },
    groups: {
        in: "body",
        optional: true,
        isArray: true,
        custom: {
            options: (vals: any[]) => (vals.length >= 1 && vals.every(Number.isSafeInteger))
        }
    },
    "*": {
        in: "body",
        custom: {
            options: (_, {path}) => {
                if (!["title", "start", "end", "groups"].includes(path))
                    throw new Error(`Additional field are not expected (${path}),`);
                return true;
            }
        }
    }
});

const groupEditSchema = checkSchema({
    color: {
        in: "body",
        optional: true,
        isRgbColor: true,
    },
    isBusy: {
        in: "body",
        optional: true,
        isBoolean: true,
    },
    priority: {
        in: "body",
        optional: true,
        isNumeric: true,
        custom: {
            options: (val: number) => val >= 1 && val <= 3
        }
    },
    reminders: {
        in: "body",
        optional: true,
        custom: {
            options: (vals: any) => {
                if (!Array.isArray(vals))
                    throw new Error("`reminders` must be array.");
                if (!vals.every(Number.isSafeInteger))
                    throw new Error("Each element in `reminders` must be number.");
                if (!vals.every(num => Object.values(ReminderOptions).includes(num)))
                    throw new Error("Custom time are not appliciable.");
                if (!vals.every((num, idx) => vals.indexOf(num) === idx)) // https://stackoverflow.com/a/9229821
                    throw new Error("Each element in `reminders` must be unique.");
                return true;
            }
        }
    },
    "*": {
        in: "body",
        custom: {
            options: (_, {path}) => {
                if (!["color", "busy", "priority", "reminders"].includes(path))
                    throw new Error(`Additional field are not expected (${path}).`);
                return true;
            }
        }
    }
});

export { eventSchema, eventEditSchema };
export { groupEditSchema };
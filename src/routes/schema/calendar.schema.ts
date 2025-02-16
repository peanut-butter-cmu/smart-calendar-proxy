import { ReminderOptions } from "../../models/calendarEventGroup.entity.js";
import { checkSchema } from "express-validator";

function noExtraFields(fields: string[]) {
    return (_, {path}) => {
        if (!fields.includes(path))
            throw new Error(`Additional field are not expected (${path}),`);
        return true;
    }
}

function remindersValidate(vals: any) {
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

function isIsoDate(str: string) {
    if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
    const d = new Date(str); 
    return !isNaN(d.getTime()) && d.toISOString()===str; // valid date 
}

function validateEmail(email: string) {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

const eventNewSchema = checkSchema({
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
    },
    "*": {
        in: "body",
        custom: {
            options: noExtraFields([ "title", "start", "end" ])
        }
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
            options: noExtraFields([ "title", "start", "end", "groups" ])
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
            options: remindersValidate
        }
    },
    "*": {
        in: "body",
        custom: {
            options: noExtraFields([ "color", "busy", "priority", "reminders" ])
        }
    }
});

const sharedNewSchema = checkSchema({
    title: {
        in: "body",
        isString: true,
        isLength: {
            options: { min: 1, max: 32 }
        }
    },
    reminders: {
        in: "body",
        custom: {
            options: remindersValidate
        }
    },
    idealDays: {
        in: "body",
        custom: {
            options: (vals: any[]) => {
                if (!Array.isArray(vals))
                    throw new Error("`idealDays` must be array.");
                if (!vals.every(Number.isSafeInteger))
                    throw new Error("Each element in `idealDays` must be number.");
                if (!vals.every((num) => num >= 0 && num <= 6))
                    throw new Error("Each element in `idealDays` must be valid JS day.");
                if (!vals.every((num, idx) => vals.indexOf(num) === idx)) // https://stackoverflow.com/a/9229821
                    throw new Error("Each element in `idealDays` must be unique.");
                return true;
            }
        }
    },
    idealTimeRange: {
        in: "body",
        custom: {
            options: (val: any) => {
                const keys = Object.keys(val);
                if (keys.length !== 2 || !keys.includes("start") || !keys.includes("end"))
                    throw new Error("`idealTimeRange` must only have `start` and `stop`.");
                const obj = val as { start: any, end: any };
                if (!isIsoDate(obj.start) || !isIsoDate(obj.end))
                    throw new Error("`idealTimeRange` contains invalid date.");
                const dateObj = { start: new Date(obj.start), end: new Date(obj.end) };
                if (dateObj.start > dateObj.end)
                    throw new Error("`idealTimeRange` contains `start` greater than `end`.");
                return true;
            }
        }
    },
    members: {
        in: "body",
        custom: {
            options: (vals: any[]) => {
                if (!Array.isArray(vals))
                    throw new Error("`members` must be array.");
                if (!vals.every(e => typeof e === "string"))
                    throw new Error("Each element in `members` must be string.");
                if (!vals.every(validateEmail))
                    throw new Error("Each element in `members` must an e-mail.");
                if (!vals.every((num, idx) => vals.indexOf(num) === idx)) // https://stackoverflow.com/a/9229821
                    throw new Error("Each element in `members` must be unique.");
                return true;
            }
        }
    },
    "*": {
        in: "body",
        custom: {
            options: (_, {path}) => {
                if (!["title", "reminders", "idealDays", "idealTimeRange", "members"].includes(path))
                    throw new Error(`Additional field are not expected (${path}).`);
                return true;
            }
        }
    }
});

const sharedEditSchema = checkSchema({
    id: {
        in: "params",
        isNumeric: true
    },
    title: {
        in: "body",
        optional: true,
        isString: true,
        isLength: {
            options: { min: 1, max: 32 }
        }
    },
    reminders: {
        in: "body",
        optional: true,
        custom: {
            options: remindersValidate
        }
    },
    idealDays: {
        in: "body",
        optional: true,
        custom: {
            options: (vals: any[]) => {
                if (!Array.isArray(vals))
                    throw new Error("`idealDays` must be array.");
                if (!vals.every(Number.isSafeInteger))
                    throw new Error("Each element in `idealDays` must be number.");
                if (!vals.every((num) => num >= 0 && num <= 6))
                    throw new Error("Each element in `idealDays` must be valid JS day.");
                if (!vals.every((num, idx) => vals.indexOf(num) === idx)) // https://stackoverflow.com/a/9229821
                    throw new Error("Each element in `idealDays` must be unique.");
                return true;
            }
        }
    },
    idealTimeRange: {
        in: "body",
        optional: true,
        custom: {
            options: (val: any) => {
                const keys = Object.keys(val);
                if (keys.length !== 2 || !keys.includes("start") || !keys.includes("end"))
                    throw new Error("`idealTimeRange` must only have `start` and `stop`.");
                const obj = val as { start: any, end: any };
                if (!isIsoDate(obj.start) || !isIsoDate(obj.end))
                    throw new Error("`idealTimeRange` contains invalid date.");
                const dateObj = { start: new Date(obj.start), end: new Date(obj.end) };
                if (dateObj.start > dateObj.end)
                    throw new Error("`idealTimeRange` contains `start` greater than `end`.");
                return true;
            }
        }
    },
    members: {
        in: "body",
        optional: true,
        custom: {
            options: (vals: any[]) => {
                if (!Array.isArray(vals))
                    throw new Error("`members` must be array.");
                if (!vals.every(e => typeof e === "string"))
                    throw new Error("Each element in `members` must be string.");
                if (!vals.every(validateEmail))
                    throw new Error("Each element in `members` must an e-mail.");
                if (!vals.every((num, idx) => vals.indexOf(num) === idx)) // https://stackoverflow.com/a/9229821
                    throw new Error("Each element in `members` must be unique.");
                return true;
            }
        }
    },
    "*": {
        in: "body",
        custom: {
            options: (_, {path}) => {
                if (!["title", "reminders", "idealDays", "idealTimeRange", "members"].includes(path))
                    throw new Error(`Additional field are not expected (${path}).`);
                return true;
            }
        }
    }
});

export { eventNewSchema, eventEditSchema };
export { groupEditSchema };
export { sharedNewSchema, sharedEditSchema }
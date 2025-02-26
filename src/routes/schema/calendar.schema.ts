import { ReminderOptions } from "../../models/EventGroup.entity.js";
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
    return !isNaN(d.getTime()) && d.toISOString() === str; // valid date 
}

function validateCMUEmail(email: string) {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@cmu\.ac\.th$/
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
    id: {
        in: "params",
        isNumeric: true
    },
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
    invites: {
        in: "body",
        custom: {
            options: (vals: any[]) => {
                if (!Array.isArray(vals))
                    throw new Error("`invites` must be array.");
                if (vals.length < 1 || vals.length > 16)
                    throw new Error("`invites` must have length between 1 to 16.");
                if (!vals.every(e => typeof e === "string"))
                    throw new Error("Each element in `invites` must be string.");
                if (!vals.every(validateCMUEmail))
                    throw new Error("Each element in `invites` must an e-mail.");
                if (!vals.every((num, idx) => vals.indexOf(num) === idx)) // https://stackoverflow.com/a/9229821
                    throw new Error("Each element in `invites` must be unique.");
                return true;
            }
        }
    },
    duration: {
        in: "body",
        isInt: {
            options: { min: 30, max: 8 * 60 },
            errorMessage: "`duration` must be a positive integer representing minutes between 30 - 480."
        },
        custom: {
            options: (val: number) => {
                if (val % 30 !== 0)
                    throw new Error("`duration` must divisible by 30.");
                return true;
            }
        }
    },
    "*": {
        in: "body",
        custom: {
            options: (_, {path}) => {
                if (!["title", "reminders", "idealDays", "idealTimeRange", "invites", "duration"].includes(path))
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
                if (keys.length !== 4 || !keys.includes("startDate") || !keys.includes("endDate")
                    || !keys.includes("startTime") || !keys.includes("endTime"))
                    throw new Error("`idealTimeRange` must only have `startDate`, `endDate` `startTime` and `endTime`.");
                const obj = val as { startDate: any, endDate: any, startTime: any, endTime: any };
                if (!isIsoDate(obj.startDate) || !isIsoDate(obj.endDate))
                    throw new Error("`idealTimeRange` contains invalid date.");
                const dateObj = { start: new Date(obj.startDate), end: new Date(obj.endDate) };
                if (dateObj.start > dateObj.end)
                    throw new Error("`idealTimeRange` contains start greater than end.");
                return true;
            }
        }
    },
    invites: {
        in: "body",
        optional: true,
        custom: {
            options: (vals: any[]) => {
                if (!Array.isArray(vals))
                    throw new Error("`invites` must be array.");
                if (vals.length < 1 || vals.length > 16)
                    throw new Error("`invites` must have length between 1 to 16.");
                if (!vals.every(e => typeof e === "string"))
                    throw new Error("Each element in `invites` must be string.");
                if (!vals.every(validateCMUEmail))
                    throw new Error("Each element in `invites` must an e-mail.");
                if (!vals.every((num, idx) => vals.indexOf(num) === idx)) // https://stackoverflow.com/a/9229821
                    throw new Error("Each element in `invites` must be unique.");
                return true;
            }
        }
    },
    duration: {
        in: "body",
        optional: true,
        isInt: {
            options: { min: 30, max: 8 * 60 }
        },
        errorMessage: "`duration` must be a positive integer representing minutes."
    },
    "*": {
        in: "body",
        custom: {
            options: (_, {path}) => {
                if (!["title", "reminders", "idealDays", "idealTimeRange", "invites", "duration"].includes(path))
                    throw new Error(`Additional field are not expected (${path}).`);
                return true;
            }
        }
    }
});

const paginationSchema = checkSchema({
    limit: {
        in: "query",
        optional: true,
        isInt: {
            options: { min: 1, max: 1000 }
        },
        toInt: true,
        errorMessage: "`limit` must be between 1 and 1000."
    },
    offset: {
        in: "query",
        optional: true,
        isInt: {
            options: { min: 0 }
        },
        toInt: true,
        errorMessage: "`offset` must be a non-negative integer."
    }
});

const dateRangeSchema = checkSchema({
    startDate: {
        in: "query",
        isDate: true,
        errorMessage: "`startDate` is required and must be a valid date."
    },
    endDate: {
        in: "query",
        isDate: true,
        errorMessage: "`endDate` is required and must be a valid date."
    }
});

export { eventNewSchema, eventEditSchema };
export { groupEditSchema };
export { sharedNewSchema, sharedEditSchema };
export { paginationSchema, dateRangeSchema };

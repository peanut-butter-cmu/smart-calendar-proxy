import { ReminderOptions } from "../../types/enums.js";
import { checkSchema } from "express-validator";

function noExtraFields(fields: string[]) {
    return (_, {path}) => {
        if (!fields.includes(path))
            throw new Error(`Additional field are not expected (${path}),`);
        return true;
    }
}

function remindersValidate(vals: unknown) {
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
        errorMessage: "`title` must string.",
        isLength: {
            options: { 
                min: 1, max: 32,
            },
            errorMessage: "`title` must have length between 1 - 32."
        }
    },
    start: {
        in: "body",
        isISO8601: true,
        errorMessage: "`start` must be valid ISO-8601 format."
    },
    end: {
        in: "body",
        isISO8601: true,
        errorMessage: "`end` must be valid ISO-8601 format."
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
    "*": {
        in: "body",
        custom: {
            options: noExtraFields([ "title", "start", "end", "isBusy" ])
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
            options: noExtraFields([ "color", "isBusy", "priority", "reminders" ])
        }
    }
});

const idealTimeRangeValidator = (val: unknown) => {
    const keys = Object.keys(val);
    if (keys.length !== 4 || !keys.includes("startDate") || !keys.includes("endDate") || 
        !keys.includes("dailyStartMin") || !keys.includes("dailyEndMin"))
        throw new Error("`idealTimeRange` must and only have `startDate`, `endDate`, `dailyStartMin` and `dailyEndMin`.");
    const obj = val as { startDate: unknown, endDate: unknown, dailyStartMin: unknown, dailyEndMin: unknown };
    function failIfKeyNotType(keys: string[], type: "string" | "number") {
        for (const key of keys.filter(key => typeof obj[key] !== type))
            throw new Error(`\`${key}\` must be a ${type}`);
    }
    failIfKeyNotType(["startDate", "endDate"], "string");
    failIfKeyNotType(["dailyStartMin", "dailyEndMin"], "number");
    const typedObj = val as { startDate: string, endDate: string, dailyStartMin: number, dailyEndMin: number };
    if (!isIsoDate(typedObj.startDate) || !isIsoDate(typedObj.endDate))
        throw new Error("`idealTimeRange` contains invalid date.");
    if (!isFinite(typedObj.dailyStartMin) || !isFinite(typedObj.dailyEndMin))
        throw new Error("`idealTimeRange` contains invalid time.");
    const dateObj = { 
        startDate: new Date(typedObj.startDate), endDate: new Date(typedObj.endDate), 
        dailyStartMin: obj.dailyStartMin as number, dailyEndMin: obj.dailyEndMin as number
    };
    if (dateObj.startDate > dateObj.endDate)
        throw new Error("`idealTimeRange` contains `startDate` greater than `endDate`.");
    if (dateObj.dailyStartMin < 0 || dateObj.dailyEndMin < 0)
        throw new Error("`idealTimeRange` contains invalid time.");
    if (dateObj.dailyStartMin > 1440 || dateObj.dailyEndMin > 1440) // 1 day = 1440 min
        throw new Error("`idealTimeRange` contains time greater than one day.");
    if (dateObj.dailyStartMin > dateObj.dailyEndMin)
        throw new Error("`idealTimeRange` contains `dailyStartMin` greater than `dailyEndMin`.");
    return true;
}

const idealDaysValidator = (vals: unknown[]) => {
    if (!Array.isArray(vals))
        throw new Error("`idealDays` must be array.");
    if (!vals.every(Number.isSafeInteger))
        throw new Error("Each element in `idealDays` must be number.");
    const numVals = vals as number[];
    if (!numVals.every((num) => num >= 0 && num <= 6))
        throw new Error("Each element in `idealDays` must be valid JS day.");
    if (!numVals.every((num, idx) => vals.indexOf(num) === idx)) // https://stackoverflow.com/a/9229821
        throw new Error("Each element in `idealDays` must be unique.");
    return true;
}

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
            options: idealDaysValidator,
        }
    },
    idealTimeRange: {
        in: "body",
        custom: { options: idealTimeRangeValidator }
    },
    invites: {
        in: "body",
        custom: {
            options: (vals: unknown[]) => {
                if (!Array.isArray(vals))
                    throw new Error("`invites` must be array.");
                if (vals.length < 1 || vals.length > 16)
                    throw new Error("`invites` must have length between 1 to 16.");
                if (!vals.every(e => typeof e === "string"))
                    throw new Error("Each element in `invites` must be string.");
                if (!vals.every(validateCMUEmail))
                    throw new Error("Each element in `invites` must a CMU e-mail.");
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
                // TODO: check if start and end are reasonable.
                return true;
            }
        }
    },
    repeat: {
        in: "body",
        optional: true,
        custom: {
            options: (val: unknown) => {
                const k = Object.keys(val);
                if (k.length !== 2 || !k.includes("type") || !k.includes("count"))
                    throw new Error("`duration` must contain only `type` and `count`.");
                const obj = val as { type: unknown, count: unknown };
                if (!["week", "month"].includes(`${obj.type}`))
                    throw new Error("`type` must be \"week\" or \"month\".");
                if (Number.isFinite(obj.count))
                    throw new Error("`count` must be number.");
                const typedObj = val as { type: "week" | "month", count: number };
                if (typedObj.count < 1 || typedObj.count > 8)
                    throw new Error("`count` must in range between 1 to 8.");
                return true;
            }
        }
    },
    "*": {
        in: "body",
        custom: {
            options: (_, {path}) => {
                if (!["title", "reminders", "idealDays", "idealTimeRange", "invites", "duration", "repeat"].includes(path))
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
            options: idealDaysValidator
        }
    },
    idealTimeRange: {
        in: "body",
        optional: true,
        custom: { options: idealTimeRangeValidator }
    },
    invites: {
        in: "body",
        optional: true,
        custom: {
            options: (vals: unknown[]) => {
                if (!Array.isArray(vals))
                    throw new Error("`invites` must be array.");
                if (vals.length < 1 || vals.length > 16)
                    throw new Error("`invites` must have length between 1 to 16.");
                if (!vals.every(e => typeof e === "string"))
                    throw new Error("Each element in `invites` must be string.");
                if (!vals.every(validateCMUEmail))
                    throw new Error("Each element in `invites` must a CMU e-mail.");
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
    repeat: {
        in: "body",
        optional: true,
        isInt: {
            options: { min: 1, max: 8 }
        },
        errorMessage: "`repeat` must be in range between 1 to 8."
    },
    "*": {
        in: "body",
        custom: {
            options: (_, {path}) => {
                if (!["title", "reminders", "idealDays", "idealTimeRange", "invites", "duration", "repeat"].includes(path))
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

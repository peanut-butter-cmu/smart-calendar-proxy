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
                return ["title", "start", "end", "groups"].includes(path)
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
    "*": {
        in: "body",
        custom: {
            options: (_, {path}) => {
                return ["color", "busy", "priority"].includes(path)
            }
        }
    }
});

export { eventSchema, eventEditSchema };
export { groupEditSchema };
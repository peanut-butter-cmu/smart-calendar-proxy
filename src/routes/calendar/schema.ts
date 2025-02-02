import { checkSchema } from "express-validator";

export const bodySchema = checkSchema({
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

export const bodySchemaEdit = checkSchema({
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
    }
});


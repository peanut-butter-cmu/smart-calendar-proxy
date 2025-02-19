import { checkSchema } from "express-validator";

function noExtraFields(fields: string[]) {
    return (_, {path}) => {
        if (!fields.includes(path))
            throw new Error(`Additional field are not expected (${path}),`);
        return true;
    }
}

const fcmTokenSchema = checkSchema({
    token: {
        in: "body",
        isString: true,
        notEmpty: true,
        errorMessage: "FCM token is required and must not be empty"
    },
    deviceName: {
        in: "body",
        isString: true,
        isLength: {
            options: { min: 1, max: 64 }
        },
        errorMessage: "Device name must be between 1 and 64 characters"
    },
    "*": {
        in: "body",
        custom: {
            options: noExtraFields(["token", "deviceName"])
        }
    }
});

export { fcmTokenSchema };

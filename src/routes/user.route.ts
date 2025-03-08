import { Router } from "express";
import { body, param, query } from "express-validator";
import { fcmTokenSchema } from "./schema/user.schema.js";
import { UserController } from "../controllers/user.controller.js";
import { DataSource } from "typeorm";
import { authorizationReport, createAuthorizationValidator, validationReport } from "../helpers/routes.js";
import { rateLimit } from "express-rate-limit";

function createUserRouter(dataSource: DataSource) {
    const app = Router();
    const userController = new UserController(dataSource);
    const authorizationValidate = createAuthorizationValidator(process.env.APP_JWT_SECRET!);

    app.post("/user/auth", 
        body("username").notEmpty().withMessage("`username` must not be empty."),
        body("password").notEmpty().withMessage("`password` must not be empty."),
        validationReport,
        userController.authenticate
    );
    app.get("/user/me",
        authorizationValidate,
        authorizationReport,
        userController.getUser
    );
    app.patch("/user/mango",
        authorizationValidate,
        authorizationReport,
        query("token").notEmpty().withMessage("`token` is required and must not be empty."),
        validationReport,
        userController.editMangoToken
    );
    app.post("/user/fcm",
        authorizationValidate,
        authorizationReport,
        fcmTokenSchema,
        validationReport,
        userController.addFCMToken
    );
    app.get("/user/fcm",
        authorizationValidate,
        authorizationReport,
        userController.getFCMTokens
    );
    app.delete("/user/fcm/:id",
        authorizationValidate,
        authorizationReport,
        param("id").isNumeric().withMessage("`id` must be number."),
        validationReport,
        userController.deleteFCMToken
    );
    app.post("/user/sync",
        authorizationValidate,
        authorizationReport,
        rateLimit({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 5,
            message: {
                error: "Too many requests, please try again later."
            }
        }),
        userController.syncUserEvents
    );

    // for development
    if (process.env.NODE_ENV === "development") {
        app.post("/dev/sync/global",
            userController.syncGlobalEvents
        );
        app.delete("/dev/user",
            authorizationValidate,
            authorizationReport,
            userController.deleteUser
        );
    }

    return app;
}

export { validationReport, authorizationReport };
export { createUserRouter };

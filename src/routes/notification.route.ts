import { Router } from "express";
import { query, param } from "express-validator";
import { paginationSchema } from "./schema/calendar.schema.js";
import { DataSource } from "typeorm";
import { authorizationReport, createAuthorizationValidator, validationReport } from "../helpers/routes.js";
import { NotificationContrller } from "../controllers/notification.controller.js";

function createNotificationRouter(dataSource: DataSource) {
    const app = Router();
    const notificationController = new NotificationContrller(dataSource);
    const authorizationValidate = createAuthorizationValidator(process.env.APP_JWT_SECRET!);

    app.get("/notifications",
        authorizationValidate,
        authorizationReport,
        query("unreadOnly").optional().isBoolean().withMessage("`unreadOnly` must be a boolean value."),
        paginationSchema,
        validationReport,
        notificationController.getNotifications
    );
    app.patch("/notifications/:id/read",
        authorizationValidate,
        authorizationReport,
        param("id").isNumeric(),
        validationReport,
        notificationController.readNotification
    );
    app.patch("/notifications/read-all",
        authorizationValidate,
        authorizationReport,
        notificationController.readAllNotifications
    );
    app.delete("/notifications/:id",
        authorizationValidate,
        authorizationReport,
        param("id").isNumeric().withMessage("`id` must be number."),
        validationReport,
        notificationController.deleteNotification
    );

    return app;
}

export { createNotificationRouter };

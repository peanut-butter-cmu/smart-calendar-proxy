import { Router } from "express";
import { param, query } from "express-validator";
import { DataSource } from "typeorm";
import { createAuthorizationValidator, validationReport } from "../helpers/routes.js";
import { authorizationReport } from "../helpers/routes.js";
import { CalendarController } from "../controllers/calendar.controller.js";
import { eventEditSchema, eventNewSchema, groupEditSchema, paginationSchema, sharedNewSchema } from "./schema/calendar.schema.js";

export function createCalendarRouter(dataSource: DataSource) {
    const router = Router();
    const calendarController = new CalendarController(dataSource);
    const authorizationValidate = createAuthorizationValidator(process.env.APP_JWT_SECRET!);

    router.get("/calendar/groups",
        authorizationValidate,
        authorizationReport,
        calendarController.getGroups
    );
    router.get("/calendar/group/:id",
        authorizationValidate,
        authorizationReport,
        param("id").isNumeric().withMessage("`id` must be number."),
        validationReport,
        calendarController.getGroup
    );
    router.patch("/calendar/group/:id",
        authorizationValidate,
        authorizationReport,
        groupEditSchema,
        validationReport,
        calendarController.editGroup
    );

    router.get("/calendar/events",
        authorizationValidate,
        authorizationReport,
        query("startDate").notEmpty().isDate().withMessage("`startDate` must be date and not empty."),
        query("endDate").notEmpty().isDate().withMessage("`endDate` must be date and not empty."),
        paginationSchema,
        validationReport,
        calendarController.getEvents
    );
    router.get("/calendar/event/:id",
        authorizationValidate,
        authorizationReport,
        param("id").isNumeric().withMessage("`id` must be number."),
        validationReport,
        calendarController.getEvent
    );
    router.post("/calendar/event",
        authorizationValidate,
        authorizationReport,
        eventNewSchema,
        validationReport,
        calendarController.addEvent
    );
    router.patch("/calendar/event/:id",
        authorizationValidate,
        authorizationReport,
        eventEditSchema,
        validationReport,
        calendarController.editEvent
    );
    router.delete("/calendar/event/:id",
        authorizationValidate,
        authorizationReport,
        param("id").isNumeric().withMessage("`id` must be number."),
        validationReport,
        calendarController.deleteEvent
    );

    router.get("/calendar/events/shared",
        authorizationValidate,
        authorizationReport,
        paginationSchema,
        validationReport,
        calendarController.getSharedEvents
    );
    router.get("/calendar/event/shared/:id",
        authorizationValidate,
        authorizationReport,
        param("id").isNumeric().withMessage("`id` must be number."),
        validationReport,
        calendarController.getSharedEvent
    );
    router.post("/calendar/event/shared",
        authorizationValidate,
        authorizationReport,
        sharedNewSchema,
        validationReport,
        calendarController.addSharedEvent
    );
    router.delete("/calendar/event/shared/:id",
        authorizationValidate,
        authorizationReport,
        param("id").isNumeric().withMessage("`id` must be number."),
        validationReport,
        calendarController.deleteSharedEvent
    );
    router.post("/calendar/event/shared/:id/accept",
        authorizationValidate,
        authorizationReport,
        param("id").isNumeric().withMessage("`id` must be number."),
        validationReport,
        calendarController.acceptSharedEvent
    );
    router.post("/calendar/event/shared/:id/reject",
        authorizationValidate,
        authorizationReport,
        param("id").isNumeric().withMessage("`id` must be number."),
        validationReport,
        calendarController.rejectSharedEvent
    );
    router.post("/calendar/event/shared/:id/arrange",
        authorizationValidate,
        authorizationReport,
        param("id").isNumeric().withMessage("`id` must be number."),
        validationReport,
        calendarController.arrangeSharedEvent
    );
    router.post("/calendar/event/shared/:id/save",
        authorizationValidate,
        authorizationReport,
        param("id").isNumeric().withMessage("`id` must be number."),
        validationReport,
        calendarController.saveSharedEvent
    );

    return router;
}

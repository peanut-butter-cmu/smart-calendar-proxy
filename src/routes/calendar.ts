import { ICalendarService } from "../services/calendar.js";
import { Router, Response } from "express";
import { expressjwt, Request as JWTRequest } from "express-jwt";
import { checkSchema, param, validationResult } from "express-validator";

export type JWTPayload = {
    id: number;
    studentNo: number;
    username: string;
    password: string;
}

const bodySchema = checkSchema({
    title: {
        in: ["body"],
        isString: true,
        isLength: {
            options: { min: 1, max: 32 }
        },
        notEmpty: true
    },
    start: {
        in: ["body"],
        isDate: true,
        notEmpty: true
    },
    end: {
        in: ["body"],
        isDate: true,
        notEmpty: true
    }
});

const bodySchemaEdit = checkSchema({
    title: {
        in: ["body"],
        optional: true,
        isString: true,
        isLength: {
            options: { min: 1, max: 32 }
        },
    },
    start: {
        in: ["body"],
        optional: true,
        isDate: true,
    },
    end: {
        in: ["body"],
        optional: true,
        isDate: true,
    }
});

export function createCalendarRouter(calendarService: ICalendarService) {
    const router = Router();
    router.get("/calendar/events", 
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            if (!req.auth || !req.auth.studentNo) {
                res.sendStatus(401);
                return;
            }
            const events = await calendarService.getEventsByOwner({ id: req.auth.id });
            if (!events) {
                res.sendStatus(401);
                return;
            }
            res.send(events);
        });
    router.get("/calendar/groups", 
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            if (!req.auth || !req.auth.studentNo) {
                res.sendStatus(401);
                return;
            }
            const groups = await calendarService.getGroupsByOwner({ id: req.auth.id });
            if (!groups) {
                res.sendStatus(401);
                return;
            }
            res.send(groups);
        });
    router.get("/calendar/event/:id", 
        param("id").notEmpty().isNumeric(),
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            const result = validationResult(req);
            if (!result.isEmpty()) {
                res.send(result.array());
                return;
            }
            if (!req.auth || !req.auth.studentNo) {
                res.sendStatus(401);
                return;
            }
            const params = req.params as any;
            const event = await calendarService.getEventById({ id: req.auth.id }, params.id);
            if (!event) {
                res.sendStatus(404);
                return;
            }
            res.send(event);
        });
    router.post("/calendar/event", 
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        bodySchema,
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            if (!req.auth || !req.auth.studentNo) {
                res.sendStatus(401);
                return;
            }
            const groups = await calendarService.getGroupsByOwner({ id: req.auth.id });
            if (!groups) {
                res.sendStatus(401);
                return;
            }
            res.send(groups);
        });
    router.patch("/calendar/event/:id",
        param("id").notEmpty().isNumeric(),
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        bodySchemaEdit,
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            const result = validationResult(req);
            if (!result.isEmpty()) {
                res.send(result.array());
                return;
            }
            if (!req.auth || !req.auth.studentNo) {
                res.sendStatus(401);
                return;
            }
            const params = req.params as any;
            const event = await calendarService.editEventById({ id: req.auth.id }, params.id, req.body);
            if (!event) {
                res.sendStatus(404);
                return;
            }
            res.send(event);
        });
    router.delete("/calendar/event/:id",
        param("id").notEmpty().isNumeric().toInt(),
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            const result = validationResult(req);
            if (!result.isEmpty()) {
                res.send(result.array());
                return;
            }
            if (!req.auth || !req.auth.studentNo) {
                res.sendStatus(401);
                return;
            }
            const params = req.params as any;
            const deleteResult = await calendarService.deleteEventById({ id: req.auth.id }, params.id);
            if (deleteResult)
                res.sendStatus(200);
            else
                res.sendStatus(404);
        });
    return router;
}
import { ICalendarService } from "../../services/calendar/index.js";
import { Router, Response } from "express";
import { expressjwt, Request as JWTRequest } from "express-jwt";
import { param, validationResult } from "express-validator";
import { bodySchema, bodySchemaEdit } from "./schema.js";

export type JWTPayload = {
    id: number;
}

export function createCalendarRouter(calendarService: ICalendarService) {
    const router = Router();
    router.get("/calendar/events", 
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            if (!req.auth || !req.auth.id) {
                res.sendStatus(401);
                return;
            }
            const events = await calendarService.getEventsByOwner(req.auth.id);
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
            if (!req.auth || !req.auth.id) {
                res.sendStatus(401);
                return;
            }
            const groups = await calendarService.getGroupsByOwner(req.auth.id);
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
            const valResult = validationResult(req);
            if (!valResult.isEmpty()) {
                res.status(400).send(valResult.array());
                return;
            }
            if (!req.auth || !req.auth.id) {
                res.sendStatus(401);
                return;
            }
            const params = req.params as any;
            const event = await calendarService.getEventById(req.auth.id, params.id);
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
            const valResult = validationResult(req);
            if (!valResult.isEmpty()) {
                res.status(400).send(valResult.array());
                return;
            }
            if (!req.auth || !req.auth.id) {
                res.sendStatus(401);
                return;
            }
            const newEvent = await calendarService.createEvent(req.auth.id, req.body);
            if (!newEvent) {
                res.sendStatus(400);
                return;
            }
            res.send(newEvent);
        });
    router.patch("/calendar/event/:id",
        param("id").notEmpty().isNumeric(),
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        bodySchemaEdit,
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            const valResult = validationResult(req);
            if (!valResult.isEmpty()) {
                res.status(400).send(valResult.array());
                return;
            }
            if (!req.auth || !req.auth.id) {
                res.sendStatus(401);
                return;
            }
            const params = req.params as any;
            const event = await calendarService.editEventById(req.auth.id, params.id, req.body);
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
            const valResult = validationResult(req);
            if (!valResult.isEmpty()) {
                res.status(400).send(valResult.array());
                return;
            }
            if (!req.auth || !req.auth.id) {
                res.sendStatus(401);
                return;
            }
            const params = req.params as any;
            const deleteResult = await calendarService.deleteEventById(req.auth.id, params.id);
            if (deleteResult)
                res.sendStatus(200);
            else
                res.sendStatus(404);
        });
    return router;
}
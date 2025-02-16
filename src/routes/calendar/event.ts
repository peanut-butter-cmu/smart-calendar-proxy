import { Response, Router } from "express";
import { expressjwt, Request as JWTRequest } from "express-jwt";
import { JWTPayload } from "./index.js";
import { ICalendarService } from "../../services/calendar/index.js";
import { param, validationResult } from "express-validator";
import { eventNewSchema, eventEditSchema } from "../schema/calendar.schema.js";

export function createEventRoutes(calendarService: ICalendarService) {
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
        eventNewSchema,
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
        eventEditSchema,
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
            if (req.body.groups)
                req.body.groups = req.body.groups.map(groupID => ({ id: groupID, owner: { id: req.auth.id } }));
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
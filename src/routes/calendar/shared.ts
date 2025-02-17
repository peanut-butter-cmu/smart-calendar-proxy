import { Router, Response } from "express";
import { expressjwt, Request as JWTRequest } from "express-jwt";
import { JWTPayload } from "./index.js";
import { param, query, validationResult } from "express-validator";
import { ISharedCalendarService } from "../../services/calendar/shared.js";
import { sharedEditSchema, sharedNewSchema, paginationSchema } from "../schema/calendar.schema.js";
import { InviteStatus } from "../../models/sharedEventInvite.entity.js";

export function createSharedCalendarRoutes(sharedCalendarService: ISharedCalendarService) {
    const router = Router();

    router.get("/calendar/events/shared",
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        query("status").optional().isIn(Object.values(InviteStatus)),
        paginationSchema,
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            const valResult = validationResult(req);
            if (!valResult.isEmpty()) {
                res.status(400).send({ message: valResult.array()[0].msg });
                return;
            }
            if (!req.auth?.id) {
                res.sendStatus(401);
                return;
            }

            try {
                const { status, limit, offset } = req.query;
                const result = await sharedCalendarService.getSharedEvents(
                    req.auth.id,
                    {
                        status: status as InviteStatus,
                        limit: limit ? parseInt(limit as string) : undefined,
                        offset: offset ? parseInt(offset as string) : undefined
                    }
                );
                res.send(result);
            } catch (error) {
                res.status(400).send({ message: (error as Error).message });
            }
        });

    router.post("/calendar/event/shared",
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        sharedNewSchema,
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            const valResult = validationResult(req);
            if (!valResult.isEmpty()) {
                res.status(400).send({ message: valResult.array()[0].msg });
                return;
            }
            if (!req.auth?.id) {
                res.sendStatus(401);
                return;
            }
            try {
                const event = await sharedCalendarService.createSharedEvent({
                    ownerId: req.auth.id,
                    ...req.body
                });
                res.status(201).send(event);
            } catch (error) {
                res.status(400).send({ message: (error as Error).message });
            }
        });

    router.patch("/calendar/event/shared/:id",
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        sharedEditSchema,
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            const valResult = validationResult(req);
            if (!valResult.isEmpty()) {
                res.status(400).send({ message: valResult.array()[0].msg });
                return;
            }
            if (!req.auth?.id) {
                res.sendStatus(401);
                return;
            }
            try {
                const event = await sharedCalendarService.updateSharedEvent(
                    parseInt(req.params.id),
                    req.auth.id,
                    req.body
                );
                res.send(event);
            } catch (error) {
                res.status(400).send({ message: (error as Error).message });
            }
        });

    router.delete("/calendar/event/shared/:id",
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        param("id").isNumeric(),
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            const valResult = validationResult(req);
            if (!valResult.isEmpty()) {
                res.status(400).send({ message: valResult.array()[0].msg });
                return;
            }
            if (!req.auth?.id) {
                res.sendStatus(401);
                return;
            }
            try {
                await sharedCalendarService.deleteSharedEvent(
                    parseInt(req.params.id),
                    req.auth.id
                );
                res.sendStatus(200);
            } catch (error) {
                res.status(400).send({ message: (error as Error).message });
            }
        });

    router.post("/calendar/event/shared/:id/accept",
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        param("id").isNumeric(),
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            const valResult = validationResult(req);
            if (!valResult.isEmpty()) {
                res.status(400).send({ message: valResult.array()[0].msg });
                return;
            }
            if (!req.auth?.id) {
                res.sendStatus(401);
                return;
            }
            try {
                const event = await sharedCalendarService.acceptInvite(
                    parseInt(req.params.id),
                    req.auth.id
                );
                res.send(event);
            } catch (error) {
                res.status(400).send({ message: (error as Error).message });
            }
        });

    router.post("/calendar/event/shared/:id/reject",
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        param("id").isNumeric(),
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            const valResult = validationResult(req);
            if (!valResult.isEmpty()) {
                res.status(400).send({ message: valResult.array()[0].msg });
                return;
            }
            if (!req.auth?.id) {
                res.sendStatus(401);
                return;
            }
            try {
                const event = await sharedCalendarService.rejectInvite(
                    parseInt(req.params.id),
                    req.auth.id
                );
                res.send(event);
            } catch (error) {
                res.status(400).send({ message: (error as Error).message });
            }
        });

    router.post("/calendar/event/shared/:id/arrange",
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        param("id").isNumeric(),
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            const valResult = validationResult(req);
            if (!valResult.isEmpty()) {
                res.status(400).send({ message: valResult.array()[0].msg });
                return;
            }
            if (!req.auth?.id) {
                res.sendStatus(401);
                return;
            }
            try {
                const event = await sharedCalendarService.arrangeEvent(
                    parseInt(req.params.id),
                    req.auth.id
                );
                res.send(event);
            } catch (error) {
                if (error instanceof Error && error.message === 'No available time slots found.')
                    res.status(409).send({ message: error.message });
                else
                    res.status(400).send({ message: (error as Error).message });
            }
        });

    return router;
}

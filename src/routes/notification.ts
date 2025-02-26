import { Router, Response } from "express";
import { expressjwt, Request as JWTRequest } from "express-jwt";
import { JWTPayload } from "./calendar/index.js";
import { query, param, validationResult } from "express-validator";
import { INotificationService } from "../services/notification/index.js";
import { paginationSchema } from "./schema/calendar.schema.js";

export function createNotificationRoutes(notificationService: INotificationService) {
    const router = Router();

    router.get("/notifications",
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        query("unreadOnly").optional().isBoolean().withMessage("`unreadOnly` must be a boolean value."),
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
                const result = await notificationService.getUserNotifications(
                    req.auth.id,
                    {
                        unreadOnly: req.query.unreadOnly === 'true',
                        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
                        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
                    }
                );
                res.send(result);
            } catch (error) {
                res.status(400).send({ message: (error as Error).message });
            }
        });

    router.patch("/notifications/:id/read",
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
                const success = await notificationService.markAsRead(
                    parseInt(req.params.id),
                    req.auth.id
                );
                if (!success) {
                    res.sendStatus(404);
                    return;
                }
                res.sendStatus(200);
            } catch (error) {
                res.status(400).send({ message: (error as Error).message });
            }
        });

    router.patch("/notifications/read-all",
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            if (!req.auth?.id) {
                res.sendStatus(401);
                return;
            }

            try {
                const success = await notificationService.markAllAsRead(req.auth.id);
                if (!success) {
                    res.sendStatus(404);
                    return;
                }
                res.sendStatus(200);
            } catch (error) {
                res.status(400).send({ message: (error as Error).message });
            }
        });

    router.delete("/notifications/:id",
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
                const success = await notificationService.deleteNotification(
                    parseInt(req.params.id),
                    req.auth.id
                );
                if (!success) {
                    res.sendStatus(404);
                    return;
                }
                res.sendStatus(200);
            } catch (error) {
                res.status(400).send({ message: (error as Error).message });
            }
        });

    return router;
}

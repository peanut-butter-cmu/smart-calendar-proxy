import { Router, Response } from "express";
import { expressjwt, Request as JWTRequest } from "express-jwt";
import { JWTPayload } from "./index.js";
import { body, param, validationResult } from "express-validator";
import { ISharedCalendarService } from "../../services/calendar/shared.js";

export function createSharedCalendarRoutes(sharedCalendarService: ISharedCalendarService) {
    const router = Router();

    router.post("/calendar/shared-group",
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        body("title").isString().notEmpty(),
        body("color").matches(/^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/),
        body("priority").isInt({ min: 1, max: 3 }),
        body("idealDays").isArray(),
        body("idealTimeRanges").isArray(),
        body("memberEmails").isArray(),
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            const valResult = validationResult(req);
            if (!valResult.isEmpty()) {
                res.status(400).send(valResult.array());
                return;
            }

            if (!req.auth?.id) {
                res.sendStatus(401);
                return;
            }

            try {
                const group = await sharedCalendarService.createSharedGroup({
                    ownerId: req.auth.id,
                    ...req.body
                });
                res.status(201).send(group);
            } catch (error) {
                res.status(400).send({ message: (error as Error).message });
            }
        });

    router.post("/calendar/shared-group/:id/members",
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        param("id").isNumeric(),
        body("emails").isArray(),
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            const valResult = validationResult(req);
            if (!valResult.isEmpty()) {
                res.status(400).send(valResult.array());
                return;
            }

            if (!req.auth?.id) {
                res.sendStatus(401);
                return;
            }

            try {
                await sharedCalendarService.addMembers(
                    parseInt(req.params.id),
                    req.auth.id,
                    req.body.emails
                );
                res.sendStatus(200);
            } catch (error) {
                res.status(400).send({ message: (error as Error).message });
            }
        });

    router.delete("/calendar/shared-group/:id/members",
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        param("id").isNumeric(),
        body("memberIds").isArray(),
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            const valResult = validationResult(req);
            if (!valResult.isEmpty()) {
                res.status(400).send(valResult.array());
                return;
            }

            if (!req.auth?.id) {
                res.sendStatus(401);
                return;
            }

            try {
                await sharedCalendarService.removeMembers(
                    parseInt(req.params.id),
                    req.auth.id,
                    req.body.memberIds
                );
                res.sendStatus(200);
            } catch (error) {
                res.status(400).send({ message: (error as Error).message });
            }
        });

    router.post("/calendar/shared-group/invite/:token/:action",
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        param("token").isUUID(),
        param("action").isIn(["accept", "reject"]),
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            const valResult = validationResult(req);
            if (!valResult.isEmpty()) {
                res.status(400).send(valResult.array());
                return;
            }

            if (!req.auth?.id) {
                res.sendStatus(401);
                return;
            }

            try {
                await sharedCalendarService.handleInvite(
                    req.params.token,
                    req.params.action as 'accept' | 'reject',
                    req.auth.id
                );
                res.sendStatus(200);
            } catch (error) {
                res.status(400).send({ message: (error as Error).message });
            }
        });

    router.get("/calendar/shared-group/invites",
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        body("email").isString(),
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            const valResult = validationResult(req);
            if (!valResult.isEmpty()) {
                res.status(400).send(valResult.array());
                return;
            }

            if (!req.auth?.id) {
                res.sendStatus(401);
                return;
            }

            try {
                const invites = await sharedCalendarService.getGroupInvites(req.body.email);
                res.send(invites);
            } catch (error) {
                res.status(400).send({ message: (error as Error).message });
            }
        });

    router.get("/calendar/shared-group/:id/members",
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        param("id").isNumeric(),
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            const valResult = validationResult(req);
            if (!valResult.isEmpty()) {
                res.status(400).send(valResult.array());
                return;
            }

            if (!req.auth?.id) {
                res.sendStatus(401);
                return;
            }

            try {
                const members = await sharedCalendarService.getGroupMembers(
                    parseInt(req.params.id),
                    req.auth.id
                );
                res.send(members);
            } catch (error) {
                res.status(400).send({ message: (error as Error).message });
            }
        });

    router.post("/calendar/shared-group/:id/schedule",
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        param("id").isNumeric(),
        body("duration").isNumeric(),
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            const valResult = validationResult(req);
            if (!valResult.isEmpty()) {
                res.status(400).send(valResult.array());
                return;
            }

            if (!req.auth?.id) {
                res.sendStatus(401);
                return;
            }

            try {
                const optimalTime = await sharedCalendarService.findOptimalMeetingTime(
                    parseInt(req.params.id),
                    req.body.duration
                );

                if (!optimalTime) {
                    res.status(404).send({ message: "No available time slots found" });
                    return;
                }

                const event = await sharedCalendarService.scheduleGroupMeeting(
                    parseInt(req.params.id),
                    req.auth.id,
                    req.body.title || "Group Meeting",
                    optimalTime,
                    req.body.duration
                );

                res.status(201).send(event);
            } catch (error) {
                res.status(400).send({ message: (error as Error).message });
            }
        });

    return router;
}

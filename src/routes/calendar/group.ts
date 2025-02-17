import { ICalendarService } from "../../services/calendar/index.js";
import { Router, Response } from "express";
import { expressjwt, Request as JWTRequest } from "express-jwt";
import { JWTPayload } from "./index.js";
import { param, validationResult } from "express-validator";
import { groupEditSchema } from "../schema/calendar.schema.js";

export function createGroupRoutes(calendarService: ICalendarService) {
    const router = Router();
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
    router.get("/calendar/group/:id", 
        param("id").notEmpty().isNumeric(),
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        async (req: JWTRequest<JWTPayload>, res: Response) => {
            const valResult = validationResult(req);
            if (!valResult.isEmpty()) {
                res.status(400).send({ message: valResult.array()[0].msg });
                return;
            }
            if (!req.auth || !req.auth.id) {
                res.sendStatus(401);
                return;
            }
            const params = req.params as any;
            const group = await calendarService.getGroupById(req.auth.id, params.id);
            if (!group) {
                res.sendStatus(404);
                return;
            }
            res.send(group);
        });
    router.patch("/calendar/group/:id",
            param("id").notEmpty().isNumeric(),
            expressjwt({ 
                secret: process.env.APP_JWT_SECRET!, 
                algorithms: ["HS256"]
            }),
            groupEditSchema,
            async (req: JWTRequest<JWTPayload>, res: Response) => {
                const valResult = validationResult(req);
                if (!valResult.isEmpty()) {
                    res.status(400).send({ message: valResult.array()[0].msg });
                    return;
                }
                if (!req.auth || !req.auth.id) {
                    res.sendStatus(401);
                    return;
                }
                const params = req.params as any;
                if (req.body.groups)
                    req.body.groups = req.body.groups.map(groupID => ({ id: groupID, owner: { id: req.auth.id } }));
                const group = await calendarService.editGroupById(req.auth.id, params.id, req.body);
                if (!group) {
                    res.sendStatus(404);
                    return;
                }
                res.send(group);
            });
    return router;
}

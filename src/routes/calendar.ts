import { ICalendarService } from "../services/calendar.js";
import { Router, Response } from "express";
import { expressjwt, Request as JWTRequest } from "express-jwt";

export type JWTPayload = {
    studentNo: number;
    username: string;
    password: string;
}

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
            const events = await calendarService.getEventsByOwner({ studentNo: req.auth.studentNo });
            if (!events) {
                res.sendStatus(401);
                return;
            }
            res.send(events);
        });
    return router;
}
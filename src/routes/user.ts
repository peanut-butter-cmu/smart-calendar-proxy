import { IUserService } from "../services/user/index.js";
import { Router } from "express";
import { expressjwt, Request as JWTRequest } from "express-jwt";
import { body, query, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import { JWTPayload } from "./calendar/index.js";

export function createUserRouter(userService: IUserService) {
    const router = Router();
    router.post("/user/auth", 
        body("username").notEmpty().withMessage("`username` must not be empty."),
        body("password").notEmpty().withMessage("`password` must not be empty."),
        async (req, res) => { 
            const result = validationResult(req);
            if (!result.isEmpty()) {
                res.send(result.array());
                return;
            }
            const authResult = await userService.auth(req.body);
            if (!authResult)
                res.sendStatus(401);
            else
                res.send(jwt.sign(authResult, process.env.APP_JWT_SECRET));
        }
    );
    router.get("/user/me",
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        async (req: JWTRequest<JWTPayload>, res) => {
            if (!req.auth || !req.auth.id) {
                res.sendStatus(401);
                return;
            }
            const user = await userService.userInfo(req.auth.id);
            if (!user) {
                res.sendStatus(404);
                return;
            }
            res.send(user);
        }
    );
    router.patch("/user/mango",
        query("token").notEmpty(),
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        async (req: JWTRequest<JWTPayload>, res) => {
            const result = validationResult(req);
            if (!result.isEmpty()) {
                res.send(result);
                return;
            }
            if (!req.auth || !req.auth.id) {
                res.sendStatus(401);
                return;
            }
            if (await userService.updateMangoToken(req.auth.id, req.query.token as string)) {
                res.sendStatus(200);
            } else {
                res.sendStatus(400);
            }
        }
    )
    return router;
}
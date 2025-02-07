import { IUserService } from "../services/user/index.js";
import { Router } from "express";
import { expressjwt, Request as JWTRequest } from "express-jwt";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import { JWTPayload } from "./calendar/index.js";

export function createUserRouter(userService: IUserService) {
    const router = Router();
    router.post("/user/auth", 
        body("username").notEmpty(),
        body("password").notEmpty(),
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
    return router;
}
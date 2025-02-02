import { IUserService } from "../services/user/index.js";
import { Router } from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";

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
        });
    return router;
}
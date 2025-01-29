import { Router } from "express";
import { body, validationResult } from "express-validator";
import { IUserService } from "../services/user.js";
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
            const signInResult = await userService.signIn(req.body);
            if (!signInResult)
                res.sendStatus(401);
            else {
                const token = jwt.sign(signInResult, process.env.APP_JWT_SECRET);
                res.send(token);
            }
        });
    return router;
}
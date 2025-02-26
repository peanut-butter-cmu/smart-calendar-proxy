import { IUserService } from "../services/user/index.js";
import { Router } from "express";
import { expressjwt, Request as JWTRequest } from "express-jwt";
import { body, query, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import { JWTPayload } from "./calendar/index.js";
import { fcmTokenSchema } from "./schema/user.schema.js";

export function createUserRouter(userService: IUserService) {
    const router = Router();
    router.post("/user/auth", 
        body("username").notEmpty().withMessage("`username` must not be empty."),
        body("password").notEmpty().withMessage("`password` must not be empty."),
        async (req, res) => {
            const valResult = validationResult(req);
            if (!valResult.isEmpty()) {
                res.status(400).send({ message: valResult.array()[0].msg });
                return;
            }
            try {
                const jwtPayload = await userService.auth(req.body);
                res.send(jwt.sign(jwtPayload, process.env.APP_JWT_SECRET));
            } catch (error) {
                const msg = (error as Error).message;
                if (msg === "Unable to sign in.")
                    res.status(401);
                else
                    res.status(400);
                res.send({ message: msg });
            }
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
        query("token").notEmpty().withMessage("`token` is required and must not be empty."),
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        async (req: JWTRequest<JWTPayload>, res) => {
            const result = validationResult(req);
            if (!result.isEmpty()) {
                res.status(400).send({ message: result.array()[0].msg });
                return;
            }
            if (!req.auth || !req.auth.id) {
                res.sendStatus(401);
                return;
            }
            if (await userService.updateMangoToken(req.auth.id, req.query.token as string)) {
                res.sendStatus(200);
            } else {
                res.status(400).send({ message: "Invalid token." });
            }
        }
    );

    router.post("/user/fcm",
        fcmTokenSchema,
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        async (req: JWTRequest<JWTPayload>, res) => {
            const valResult = validationResult(req);
            if (!valResult.isEmpty()) {
                res.status(400).send({ message: valResult.array()[0].msg });
                return;
            }
            if (!req.auth || !req.auth.id) {
                res.sendStatus(401);
                return;
            }
            try {
                const result = await userService.addFCMToken(req.auth.id, req.body.token, req.body.deviceName);
                res.send(result);
            } catch (error) {
                const msg = (error as Error).message;
                res.status(400).send({ message: msg });
            }
        }
    );

    router.get("/user/fcm",
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        async (req: JWTRequest<JWTPayload>, res) => {
            if (!req.auth || !req.auth.id) {
                res.sendStatus(401);
                return;
            }
            const tokens = await userService.listFCMTokens(req.auth.id);
            res.send(tokens);
        }
    );

    router.delete("/user/fcm/:id",
        expressjwt({ 
            secret: process.env.APP_JWT_SECRET!, 
            algorithms: ["HS256"]
        }),
        async (req: JWTRequest<JWTPayload>, res) => {
            if (!req.auth || !req.auth.id) {
                res.sendStatus(401);
                return;
            }
            const success = await userService.deleteFCMToken(req.auth.id, req.params.id);
            if (success) {
                res.sendStatus(200);
            } else {
                res.status(404).send({ message: "FCM token not found" });
            }
        }
    );

    return router;
}

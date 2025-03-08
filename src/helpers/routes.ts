import { Request, Response } from "express";
import { expressjwt } from "express-jwt";
import { validationResult } from "express-validator";
import { JWTPayload } from "../types/global.js";

function validationReport(req: Request, res: Response, next: () => void) {
    const valResult = validationResult(req);
    if (!valResult.isEmpty())
        res.status(400).send({ message: valResult.array()[0].msg });

    else
        next();
}

function authorizationReport(req: Request & { auth: JWTPayload; }, res: Response, next: () => void) {
    if (!req.auth?.id)
        res.status(401).send({ message: "Invalid authorization." });

    else
        next();
}

function createAuthorizationValidator(secret: string) {
    return [
        expressjwt({
            secret,
            algorithms: ["HS256"]
        }),
        (err: Error, _req: Request, res: Response, next: () => void) => {
            if (err)
                res.status(401).send({ message: err.message });
            else
                next();
        }
    ];
}

export { validationReport, authorizationReport, createAuthorizationValidator };

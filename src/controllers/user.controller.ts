import jwt from "jsonwebtoken";
import { DataSource } from "typeorm";
import { fJWTPayload, fUser } from "../helpers/formatter.js";
import { Request, Response } from "express";
import { JWTRequest } from "../types/global.js";
import { UserService, LoginError } from "../services/user.service.js";
import * as swagger from "../types/swagger.js";
import { SyncService } from "../services/sync.service.js";

export class UserController {
    private _userService: UserService;
    private _syncService: SyncService;
    constructor(dataSource: DataSource) {
        this._userService = new UserService(dataSource)
        this._syncService = new SyncService(dataSource, { userService: this._userService });
    }

    authenticate = async (
        req: Request<object, object, { username: string; password: string; }>, 
        res: Response<string | swagger.Error>
    ) => {
        try {
            const payload = await this._userService.auth(req.body);
            res.send(jwt.sign(fJWTPayload(payload), process.env.APP_JWT_SECRET));
        } catch (error) {
            const msg = (error as Error).message;
            if (msg === LoginError.INVALID_USER_CRED)
                res.status(401);
            else
                res.status(400);
            res.send({ message: msg });
        }
    }

    getUser = async (
        req: JWTRequest,
        res: Response<swagger.User | swagger.Error>
    ) => {
        try {
            const user = await this._userService.getUserById(req.auth.id);
            res.send(fUser(user));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    editMangoToken = async (
        req: JWTRequest<object, { token: string }>,
        res: Response<void | swagger.Error>
    ) => {
        try {
            await this._userService.updateMangoToken(req.auth.id, req.query.token);
            res.sendStatus(204);
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    addFCMToken = async (
        req: JWTRequest<object, object, swagger.FCMTokenNew>,
        res: Response<swagger.FCMToken | swagger.Error>
    ) => {
        try {
            res.send(await this._userService.addFCMToken(
                req.auth.id, req.body.token, req.body.deviceName
            ));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    getFCMTokens = async (
        req: JWTRequest,
        res: Response<swagger.FCMToken[] | swagger.Error>
    ) => {
        try {
            res.send(await this._userService.listFCMTokens(req.auth.id));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    deleteFCMToken = async (
        req: JWTRequest<{id: string}>,
        res: Response<void | swagger.Error>
    ) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id))
                throw new Error("Invalid FCM token ID.");
            await this._userService.deleteFCMToken(req.auth.id, id);
            res.sendStatus(204);
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    syncUserEvents = async (
        req: JWTRequest,
        res: Response<void | swagger.Error>
    ) => {
        try {
            await this._syncService.syncUserEvents(req.auth.id);
            res.sendStatus(204);
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    syncGlobalEvents = async (
        req: Request,
        res: Response<void | swagger.Error>
    ) => {
        try {
            await this._syncService.syncGlobalEvents();
            res.sendStatus(204);
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }
}

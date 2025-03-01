import { Response } from "express";
import { NotificationService } from "../services/notification.service.js";
import { DataSource } from "typeorm";
import * as swagger from "../types/swagger.js";
import { JWTRequest } from "../types/global.js";
import { createPaginationParam } from "../helpers/pagination.js";

class NotificationContrller {
    private _service: NotificationService;
    constructor(dataSource: DataSource) {
        this._service = new NotificationService(dataSource);
    }

    getNotifications = async (
        req: JWTRequest<object, { unreadOnly?: string } & swagger.PaginationRequest>,
        res: Response<swagger.Pagination<swagger.Notification> | swagger.Error>
    ) => {
        try {
            res.send(await this._service.getNotificationsByOwner(
                req.auth.id,
                {
                    unreadOnly: req.query.unreadOnly && req.query.unreadOnly === "true",
                    ...createPaginationParam("notifications", req.query)
                }
            ));
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    readNotification = async (
        req: JWTRequest<{ id: number }>,
        res: Response<void | swagger.Error>
    ) => {
        try {
            await this._service.markAsRead(req.params.id, req.auth.id);
            res.sendStatus(200);
        } catch (error) {
            res.status(404).send({ message: (error as Error).message });
        }
    }

    readAllNotifications = async (
        req: JWTRequest,
        res: Response<void | swagger.Error>
    ) => {
        try {
            await this._service.markAllAsRead(req.auth.id);
            res.sendStatus(200);
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    deleteNotification = async (
        req: JWTRequest<{ id: number }>,
        res: Response<void | swagger.Error>
    ) => {
        try {
            if (await this._service.deleteNotification(req.params.id, req.auth.id))
                res.sendStatus(200)
            else
                res.sendStatus(404)
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }
}

export { NotificationContrller };

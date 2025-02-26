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
        req: JWTRequest<{}, { unreadOnly?: string } & swagger.PaginationRequest>,
        res: Response<swagger.Pagination<swagger.Notification> | swagger.Error>
    ) => {
        try {
            const result = await this._service.getNotificationsByOwner(
                req.auth.id,
                {
                    unreadOnly: req.query.unreadOnly && req.query.unreadOnly === "true",
                    ...createPaginationParam(req.query)
                }
            );
            res.send(result);
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    readNotification = async (
        req: JWTRequest<{ id: number }>,
        res: Response<void | swagger.Error>
    ) => {
        try {
            const success = await this._service.markAsRead(
                req.params.id,
                req.auth.id
            );
            if (!success) {
                res.sendStatus(404);
                return;
            }
            res.sendStatus(200);
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }

    readAllNotifications = async (
        req: JWTRequest,
        res: Response<void | swagger.Error>
    ) => {
        try {
            const success = await this._service.markAllAsRead(req.auth.id);
            if (!success) {
                res.sendStatus(404);
                return;
            }
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
            const success = await this._service.deleteNotification(
                req.params.id,
                req.auth.id
            );
            if (!success) {
                res.sendStatus(404);
                return;
            }
            res.sendStatus(200);
        } catch (error) {
            res.status(400).send({ message: (error as Error).message });
        }
    }
}

export { NotificationContrller };

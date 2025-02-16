import { DataSource, Repository } from "typeorm";
import { Notification, NotificationType } from "../../models/notification.entity.js";

export interface INotificationService {
    createNotification(params: {
        userId: number,
        type: NotificationType,
        data: any
    }): Promise<Notification>;

    getUserNotifications(
        userId: number,
        options?: {
            unreadOnly?: boolean,
            limit?: number,
            offset?: number
        }
    ): Promise<{
        notifications: Notification[],
        total: number
    }>;

    markAsRead(
        notificationId: number,
        userId: number
    ): Promise<boolean>;

    markAllAsRead(userId: number): Promise<boolean>;

    deleteNotification(
        notificationId: number,
        userId: number
    ): Promise<boolean>;
}

export class NotificationService implements INotificationService {
    private _notification: Repository<Notification>;

    constructor(dataSource: DataSource) {
        this._notification = dataSource.getRepository(Notification);
    }

    async createNotification(params: {
        userId: number,
        type: NotificationType,
        data: any
    }): Promise<Notification> {
        const notification = this._notification.create({
            user: { id: params.userId },
            type: params.type,
            data: params.data,
            read: false
        });
        return await this._notification.save(notification);
    }

    async getUserNotifications(
        userId: number,
        options: {
            unreadOnly?: boolean,
            limit?: number,
            offset?: number
        } = {}
    ): Promise<{
        notifications: Notification[],
        total: number
    }> {
        const query = this._notification.createQueryBuilder("notification")
            .where("notification.user.id = :userId", { userId });

        if (options.unreadOnly) {
            query.andWhere("notification.read = false");
        }

        const total = await query.getCount();

        query.orderBy("notification.createdAt", "DESC");

        if (options.limit) {
            query.take(options.limit);
        }
        if (options.offset) {
            query.skip(options.offset);
        }

        const notifications = await query.getMany();

        return {
            notifications,
            total
        };
    }

    async markAsRead(notificationId: number, userId: number): Promise<boolean> {
        const result = await this._notification.update(
            { id: notificationId, user: { id: userId } },
            { read: true }
        );
        return result.affected > 0;
    }

    async markAllAsRead(userId: number): Promise<boolean> {
        const result = await this._notification.update(
            { user: { id: userId }, read: false },
            { read: true }
        );
        return result.affected > 0;
    }

    async deleteNotification(notificationId: number, userId: number): Promise<boolean> {
        const result = await this._notification.delete({
            id: notificationId,
            user: { id: userId }
        });
        return result.affected > 0;
    }
}

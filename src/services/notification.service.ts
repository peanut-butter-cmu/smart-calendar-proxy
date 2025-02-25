import { DataSource, Repository } from "typeorm";
import { Notification, NotificationType } from "../models/Notification.entity.js";
import * as swagger from "../types/swagger.js";
import { fCMUUsername, fNotification } from "../helpers/formatter.js";
import { User } from "../models/User.entity.js";

export type Message = {eventId: number } | { email: string };

export class NotificationService {
    private _notification: Repository<Notification>;
    private _user: Repository<User>;

    constructor(dataSource: DataSource) {
        this._notification = dataSource.getRepository(Notification);
        this._user = dataSource.getRepository(User);
    }

    async notifyByEmails(emails: string[], type: NotificationType, message: Message) {
        const where = emails.map(fCMUUsername).map(username => ({ CMUUsername: username }));
        const users = await this._user.findBy(where);
        await this.notifyByUsers(users, type, message);
    }

    async notifyByIDs(userIds: number[], type: NotificationType, message: Message) {
        const where = userIds.map(id => ({ id }));
        const users = await this._user.findBy(where);
        await this.notifyByUsers(users, type, message);
    }

    async notifyByUsers(users: User[], type: NotificationType, message: Message) {
        const notifications = this._notification.create(users.map(user => ({
            owner: { id: user.id },
            type,
            data: message
        })));
        await this._notification.save(notifications);
    }

    async getNotificationsByOwner(
        ownerId: number,
        params: {
            unreadOnly: boolean,
            limit: number,
            offset: number
        }
    ): Promise<swagger.Pagination<swagger.Notification>> {
        const [notifications, total] = await this._notification.findAndCount({
            where: {
                owner: { id: ownerId },
                read: params.unreadOnly ? false : undefined
            },
            take: params.limit,
            skip: params.offset
        });
        return {
            notifications: notifications.map(fNotification),
            pagination: {
                total,
                limit: params.limit,
                offset: params.offset
            }
        };
    }

    async markAsRead(notificationId: number, ownerId: number) {
        const notification = await this._notification.findOneBy({
            id: notificationId,
            owner: { id: ownerId },
            read: false
        });
        if (!notification)
            throw new Error("Notification not found.");
        await this._notification.save({ ...notification, read: true });
    }

    async markAllAsRead(ownerId: number) {
        const notifications = await this._notification.findBy({
            owner: { id: ownerId },
            read: false
        });
        await this._notification.save(notifications.map(n => ({ ...n, read: true })));
    }

    async deleteNotification(notificationId: number, ownerId: number): Promise<boolean> {
        const notification = await this._notification.findOneBy({ 
            id: notificationId, 
            owner: { id: ownerId } 
        });
        if (!notification)
            return false;
        await this._notification.remove(notification);
        return true;
    }
}

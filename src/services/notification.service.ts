import { DataSource, Repository } from "typeorm";
import { Notification } from "../models/notification.entity.js";
import { NotificationType } from "types/enums.js";
import * as swagger from "../types/swagger.js";
import { fCMUUsername, fNotification } from "../helpers/formatter.js";
import { getMessaging } from "firebase-admin/messaging";
import { User } from "../models/user.entity.js";
import { SessionService } from "./session.service.js";

export type Message = { eventId: number, eventTitle: string } | { email: string };

export class NotificationService {
    private _notification: Repository<Notification>;
    private _user: Repository<User>;
    private _sessionService: SessionService;

    constructor(dataSource: DataSource, sessionService?: SessionService) {
        this._notification = dataSource.getRepository(Notification);
        this._user = dataSource.getRepository(User);
        this._sessionService = sessionService || new SessionService(dataSource);
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

    async notifyFirebaseByUsers(users: User[], type: NotificationType, message: Message) {
        const msging = getMessaging();
        const sessions = await this._sessionService.findByUserIds(users.map(u => u.id));
        if (sessions.length === 0)
            return;
        const messages = sessions.map(session => ({
            data: {
                type,
                msg: JSON.stringify(message),
            },
            token: session.fcmToken
        }));
        
        const response = await msging.sendEach(messages);
        if (response.failureCount > 0) {
            const unregisteredTokens = response.responses
                .map((resp, idx) => {
                    if (!resp.success && 
                        (resp.error.code === 'messaging/registration-token-not-registered' ||
                            resp.error.code === 'messaging/invalid-registration-token')) {
                        return sessions[idx].fcmToken;
                    }
                    return null;
                })
                .filter((token): token is string => token !== null);
            
            if (unregisteredTokens.length > 0) {
                console.log(`Removing ${unregisteredTokens.length} unregistered tokens`);
                try {
                    await this._sessionService.removeByTokens(unregisteredTokens);
                } catch (error) {
                    console.error("Failed to remove some unregistered tokens:", error);
                }
            }
            
            console.error("Failed to send some notifications:", response.responses.filter(r => !r.success));
        }
        return response;
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

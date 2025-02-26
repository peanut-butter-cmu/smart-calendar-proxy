import { DataSource, LessThan, Repository } from "typeorm";
import { Notification, NotificationType } from "../models/Notification.entity.js";
import { NotificationDeliveryType, NotificationStatus } from "./notification/types.js";
import { MockNotificationProcessor } from "./notification/processor.js";
import * as swagger from "../types/swagger.js";
import { fNotification } from "../helpers/formatter.js";

export type Message = {
    type: NotificationType.EVENT_INVITE | NotificationType.MEETING_SCHEDULED | NotificationType.EVENT_DELETED,
    eventId: number
} | {
    type: NotificationType.INVITE_ACCEPTED | NotificationType.INVITE_REJECTED,
    email: string
};

export class NotificationService {
    private _notification: Repository<Notification>;
    private _processor: MockNotificationProcessor;

    constructor(dataSource: DataSource) {
        this._notification = dataSource.getRepository(Notification);
        this._processor = new MockNotificationProcessor();
    }

    async notifyByEmails(email: string[], message: Message, inApp: boolean = true) {

    }

    async notifyByIDs(userId: number[], message: Message, inApp: boolean = true) {

    }

    async getNotificationsByOwner(
        ownerId: number,
        params: {
            unreadOnly: boolean,
            limit: number,
            offset: number
        }
    ): Promise<swagger.Pagination<swagger.Notification>> {
        const query = this._notification.createQueryBuilder("notification")
            .where("notification.user.id = :userId", { userId: ownerId })
            .andWhere("notification.deliveryType = :deliveryType", { 
                deliveryType: NotificationDeliveryType.IN_APP 
            })
        if (params.unreadOnly)
            query.andWhere("notification.read = false");
        query.take(params.limit)
             .skip(params.offset);
        const total = await query.getCount();
        query.orderBy("notification.createdAt", "DESC");
        const notifications = await query.getMany();
        return {
            notifications: notifications.map(fNotification),
            pagination: {
                total: total,
                limit: params.limit,
                offset: params.offset
            }
        };
    }

    async markAsRead(notificationId: number, userId: number): Promise<boolean> {
        const result = await this._notification.update(
            { 
                id: notificationId, 
                user: { id: userId },
                deliveryType: NotificationDeliveryType.IN_APP
            },
            { read: true }
        );
        return result.affected > 0;
    }

    async markAllAsRead(userId: number): Promise<boolean> {
        const result = await this._notification.update(
            { 
                user: { id: userId }, 
                read: false,
                deliveryType: NotificationDeliveryType.IN_APP
            },
            { read: true }
        );
        return result.affected > 0;
    }

    async deleteNotification(notificationId: number, userId: number): Promise<boolean> {
        const result = await this._notification.delete({
            id: notificationId,
            user: { id: userId },
            deliveryType: NotificationDeliveryType.IN_APP
        });
        return result.affected > 0;
    }

    async processScheduledNotifications(): Promise<void> {
        const now = new Date();
        const pendingNotifications = await this._notification.find({
            where: {
                status: NotificationStatus.PENDING,
                scheduledFor: LessThan(now)
            }
        });

        if (pendingNotifications.length > 0) {
            await this._processor.processBatch(pendingNotifications);
            await this._notification.save(pendingNotifications);
        }
    }

    async retryFailedNotifications(): Promise<void> {
        const failedNotifications = await this._notification.find({
            where: {
                status: NotificationStatus.FAILED,
                retryCount: LessThan(3),
                scheduledFor: LessThan(new Date())
            }
        });

        if (failedNotifications.length > 0) {
            await this._processor.processBatch(failedNotifications);
            await this._notification.save(failedNotifications);
        }
    }
}

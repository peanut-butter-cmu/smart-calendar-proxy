import { DataSource, LessThan, Repository } from "typeorm";
import { Notification, NotificationType } from "../../models/notification.entity.js";
import { NotificationDeliveryType, NotificationStatus } from "./types.js";
import { MockNotificationProcessor } from "./processor.js";

export interface INotificationService {
    createNotification(params: {
        userId?: number,
        type: NotificationType,
        data: any,
        deliveryType: NotificationDeliveryType,
        deliveryMetadata?: {
            emailTo?: string;
            fcmToken?: string;
        },
        scheduledFor?: Date
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

    processScheduledNotifications(): Promise<void>;
    
    retryFailedNotifications(): Promise<void>;
}

export class NotificationService implements INotificationService {
    private _notification: Repository<Notification>;
    private _processor: MockNotificationProcessor;

    constructor(dataSource: DataSource) {
        this._notification = dataSource.getRepository(Notification);
        this._processor = new MockNotificationProcessor();
    }

    async createNotification(params: {
        userId?: number,
        type: NotificationType,
        data: any,
        deliveryType: NotificationDeliveryType,
        deliveryMetadata?: {
            emailTo?: string;
            fcmToken?: string;
        },
        scheduledFor?: Date
    }): Promise<Notification> {
        const notification = this._notification.create({
            user: params.userId ? { id: params.userId } : undefined,
            type: params.type,
            data: params.data,
            deliveryType: params.deliveryType,
            deliveryMetadata: params.deliveryMetadata,
            scheduledFor: params.scheduledFor,
            status: params.scheduledFor ? NotificationStatus.PENDING : NotificationStatus.SENT,
            read: false
        });

        const savedNotification = await this._notification.save(notification);

        // Process immediately if not scheduled
        if (!params.scheduledFor) {
            await this._processor.processNotification(savedNotification);
            await this._notification.save(savedNotification);
        }

        return savedNotification;
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
            .where("notification.user.id = :userId", { userId })
            .andWhere("notification.deliveryType = :deliveryType", { 
                deliveryType: NotificationDeliveryType.IN_APP 
            });

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

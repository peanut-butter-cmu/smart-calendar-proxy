import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity.js";
import { NotificationDeliveryType, NotificationStatus } from "../services/notification/types.js";

export enum NotificationType {
    GROUP_INVITE = 'group_invite',
    INVITE_ACCEPTED = 'invite_accepted',
    INVITE_REJECTED = 'invite_rejected',
    MEMBER_ADDED = 'member_added',
    MEMBER_REMOVED = 'member_removed',
    MEETING_SCHEDULED = 'meeting_scheduled',
    EVENT_DELETED = 'event_deleted'
}

@Entity()
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User)
    @Index()
    user: Relation<User>;

    @Column({
        type: 'enum',
        enum: NotificationType
    })
    type: NotificationType;

    @Column('jsonb')
    data: {
        eventId?: number;
        eventName?: string;
        inviteToken?: string;
        meetingId?: number;
        meetingTime?: string;
        memberEmail?: string;
    };

    @Column({
        type: 'enum',
        enum: NotificationDeliveryType,
        default: NotificationDeliveryType.IN_APP
    })
    deliveryType: NotificationDeliveryType;

    @Column({ nullable: true })
    scheduledFor: Date;

    @Column({
        type: 'enum',
        enum: NotificationStatus,
        default: NotificationStatus.PENDING
    })
    status: NotificationStatus;

    @Column({ default: 0 })
    retryCount: number;

    @Column({ type: 'jsonb', nullable: true })
    deliveryMetadata: {
        emailTo?: string;
        fcmToken?: string;
        lastAttempt?: Date;
        errorMessage?: string;
    };

    @Column({ default: false })
    read: boolean;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    updatedAt: Date;
}

import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from "typeorm";
import { User } from "./User.entity.js";

export enum NotificationType {
    EVENT_CREATED = "event_created",
    MEETING_SCHEDULED = "event_scheduled",
    EVENT_DELETED = "event_deleted",
    INVITE_ACCEPTED = "invite_accepted",
    INVITE_REJECTED = "invite_rejected",
    EVENT_REMINDER = "event_reminder"
}

@Entity()
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User)
    @Index()
    owner: Relation<User>;

    @Column({ type: "enum", enum: NotificationType })
    type: NotificationType;

    @Column("jsonb")
    data: {
        // For event
        eventId?: number;

        // For invites
        email?: string;
    };

    @Column({ default: false })
    read: boolean;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    updatedAt: Date;
}

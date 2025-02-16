import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity.js";

export enum NotificationType {
    GROUP_INVITE = 'group_invite',
    INVITE_ACCEPTED = 'invite_accepted',
    INVITE_REJECTED = 'invite_rejected',
    MEMBER_ADDED = 'member_added',
    MEMBER_REMOVED = 'member_removed',
    MEETING_SCHEDULED = 'meeting_scheduled'
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
        groupId?: number;
        groupName?: string;
        inviteToken?: string;
        meetingId?: number;
        meetingTime?: string;
        memberEmail?: string;
    };

    @Column({ default: false })
    read: boolean;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    updatedAt: Date;
}

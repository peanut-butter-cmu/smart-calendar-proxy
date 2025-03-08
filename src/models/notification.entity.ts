import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity.js";
import { NotificationType } from "../types/enums.js";

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
        eventTitle?: string;

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

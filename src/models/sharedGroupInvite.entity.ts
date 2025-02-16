import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from "typeorm";
import { SharedEventGroup } from "./sharedEventGroup.entity.js";

export enum InviteStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected'
}

@Entity()
export class SharedGroupInvite {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => SharedEventGroup, group => group.invites)
    group: Relation<SharedEventGroup>;

    @Column()
    @Index()
    email: string;

    @Column({
        type: 'enum',
        enum: InviteStatus,
        default: InviteStatus.PENDING
    })
    status: InviteStatus;

    @Column({ type: 'uuid', generated: 'uuid' })
    @Index()
    token: string;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    updatedAt: Date;
}

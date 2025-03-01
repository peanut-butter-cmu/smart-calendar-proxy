import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from "typeorm";
import { SharedEvent } from "./sharedEvent.entity.js";
import { InviteStatus } from "../types/enums.js";

@Entity()
export class SharedEventInvite {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => SharedEvent, event => event.invites)
    event: Relation<SharedEvent>;

    @Column()
    @Index()
    email: string;

    @Column({ type: 'enum', enum: InviteStatus, default: InviteStatus.PENDING })
    status: InviteStatus;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    updatedAt: Date;
}

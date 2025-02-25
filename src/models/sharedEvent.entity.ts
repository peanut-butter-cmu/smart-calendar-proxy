import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Relation, ManyToMany, Index, CreateDateColumn, UpdateDateColumn, OneToMany, JoinTable } from "typeorm";
import { CalendarEvent } from "./CalendarEvent.entity.js";
import { User } from "./User.entity.js";
import { ReminderOptions } from "./EventGroup.entity.js";
import { SharedEventInvite } from "./SharedEventInvite.entity.js";

export enum SharedEventStatus {
    PENDING = "pending",
    ARRANGED = "arranged",
    DELETED = "deleted"
}

@Entity()
export class SharedEvent {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({ length: 255 })
    @Index()
    public title: string;

    @Column("int", { array: true, default: [] })
    public reminders: ReminderOptions[];

    @Column("int", { array: true })
    public idealDays: number[];

    @Column("jsonb")
    public idealTimeRange: { 
        startDate: Date;
        endDate: Date; 
        dailyStartMin: number;
        dailyEndMin: number;
    };

    @Column({
        type: "enum",
        enum: SharedEventStatus,
        default: SharedEventStatus.PENDING
    })
    public status: SharedEventStatus;

    @Column("int")
    public duration: number;

    @ManyToOne(() => User)
    @Index()
    public owner: Relation<User>;

    @ManyToMany(() => User)
    @JoinTable()
    public members: Relation<User[]>;

    @OneToMany(() => SharedEventInvite, invite => invite.event, { cascade: true })
    public invites: Relation<SharedEventInvite[]>;

    @ManyToMany(() => CalendarEvent, { cascade: true })
    @JoinTable()
    public events: Relation<CalendarEvent[]>;

    @Column("jsonb", { nullable: true })
    public repeat: { 
        type: "weekly" | "monthly";
        count: number;
    };

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    public createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    public updatedAt: Date;
}

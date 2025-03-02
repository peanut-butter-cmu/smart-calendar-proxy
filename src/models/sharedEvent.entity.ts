import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Relation, ManyToMany, Index, CreateDateColumn, UpdateDateColumn, OneToMany, JoinTable } from "typeorm";
import { CalendarEvent } from "./calendarEvent.entity.js";
import { User } from "./user.entity.js";
import { ReminderOptions, SharedEventStatus } from "../types/enums.js";
import { SharedEventInvite } from "./sharedEventInvite.entity.js";

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

    @OneToMany(() => SharedEventInvite, invite => invite.event, { cascade: ["remove"] })
    public invites: Relation<SharedEventInvite[]>;

    @ManyToMany(() => CalendarEvent, { cascade: ["remove"] })
    @JoinTable()
    public events: Relation<CalendarEvent[]>;

    @Column("jsonb", { nullable: true })
    public repeat?: { 
        type: "week" | "month";
        count: number;
    };

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    public createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    public updatedAt: Date;
}

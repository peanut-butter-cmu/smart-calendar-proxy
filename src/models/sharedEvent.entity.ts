import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Relation, ManyToMany, Index, CreateDateColumn, UpdateDateColumn, OneToMany, JoinTable } from "typeorm";
import { CalendarEvent } from "./calendarEvent.entity.js";
import { User } from "./user.entity.js";
import { ReminderOptions } from "./calendarEventGroup.entity.js";
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
    public idealTimeRange: { start: string, end: string };

    @ManyToOne(() => User)
    @Index()
    public owner: Relation<User>;

    @ManyToMany(() => User)
    @JoinTable()
    public members: Relation<User[]>;

    @OneToMany(() => SharedEventInvite, invite => invite.event)
    public invites: Relation<SharedEventInvite[]>;

    @ManyToMany(() => CalendarEvent)
    @JoinTable()
    public events: Relation<CalendarEvent[]>;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    public createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    public updatedAt: Date;
}

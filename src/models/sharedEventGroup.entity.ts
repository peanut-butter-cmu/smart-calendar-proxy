import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Relation, ManyToMany, Index, Check, CreateDateColumn, UpdateDateColumn, OneToMany, JoinTable } from "typeorm";
import { CalendarEvent } from "./calendarEvent.entity.js";
import { User } from "./user.entity.js";
import { Priority, ReminderOptions } from "./calendarEventGroup.entity.js";
import { SharedGroupInvite } from "./sharedGroupInvite.entity.js";

@Entity()
export class SharedEventGroup {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({ length: 255 })
    @Index()
    public title: string;

    @Column({ length: 18, name: 'color' })
    @Check(`"color" ~ '^rgb([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]),\\s*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]),\\s*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])$'`)
    public color: string;

    @Column({ type: 'enum', enum: Priority })
    public priority: Priority;

    @Column("int", { array: true, default: [] })
    public reminders: ReminderOptions[];

    @ManyToOne(() => User)
    @Index()
    public owner: Relation<User>;

    @Column("varchar", { array: true })
    public idealDays: string[];

    @Column("jsonb")
    public idealTimeRanges: { start: string, end: string }[];

    @ManyToMany(() => User)
    @JoinTable()
    public members: Relation<User[]>;

    @OneToMany(() => SharedGroupInvite, invite => invite.group)
    public invites: Relation<SharedGroupInvite[]>;

    @ManyToMany(() => CalendarEvent)
    @JoinTable()
    public events: Relation<CalendarEvent[]>;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    public createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    public updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Relation, ManyToMany, Index } from "typeorm";
import { CalendarEvent } from "./calendarEvent.entity.js";
import { User } from "./user.entity.js";
import { EventGroupType, Priority, ReminderOptions } from "../types/enums.js";

@Entity()
export class CalendarEventGroup {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({ length: 255 })
    @Index()
    public title: string;

    @Column({ default: false })
    public readonly: boolean;

    @Column({ type: 'enum', enum: EventGroupType, default: EventGroupType.SYSTEM })
    public type: EventGroupType;

    @Column({ length: 18, name: 'color' })
    public color: string;

    @Column({ type: 'enum', enum: Priority })
    public priority: Priority;

    @Column({ default: false })
    public isBusy: boolean;

    @Column("int", { array: true, default: [] })
    public reminders: ReminderOptions[];

    @ManyToMany(() => CalendarEvent, event => event.groups)
    public events: Relation<CalendarEvent[]>;

    @ManyToOne(() => User, (user) => user.eventsGroups, { onDelete: 'CASCADE' })
    @Index()
    public owner: Relation<User>;
}

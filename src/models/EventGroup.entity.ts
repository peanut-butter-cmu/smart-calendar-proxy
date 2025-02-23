import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Relation, ManyToMany, Index } from "typeorm";
import { CalendarEvent } from "./CalendarEvent.entity.js";
import { User } from "./User.entity.js";

export enum EventGroupType {
    SYSTEM = "system",
    COURSE = "course"
};

export enum Priority {
    LOW = 1,
    MEDIUM = 2,
    HIGH = 3
}

export enum ReminderOptions {
    AT_TIME_EVENT = 0, 
    FIVE_MINUTES = 5,
    TEN_MINUTES = 10,
    FIFTEEN_MINUTES = 15,
    THIRTY_MINUTES = 30,
    ONE_HOUR = 60,
    TWO_HOURS = 120,
    ONE_DAY = 1440, // 24 hours * 60 minutes
    TWO_DAYS = 2880, // 48 hours * 60 minutes
    ONE_WEEK = 10080 // 7 days * 24 hours * 60 minutes
}

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

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Relation } from "typeorm";
import { User } from "./user.entity.js";

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

    @Column()
    public title: string;

    @Column()
    public system: boolean;

    @Column()
    public color: string;

    @Column()
    public priority: Priority;

    @Column()
    public isBusy: boolean;

    @Column("int", { array: true })
    public reminders: ReminderOptions[];

    @ManyToOne(() => User, (user) => user.eventsGroups)
    public owner: Relation<User>;
}

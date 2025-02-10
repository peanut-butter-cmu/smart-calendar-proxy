import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Relation } from "typeorm";
import { User } from "./user.entity.js";

export enum Priority {
    LOW = 1,
    MEDIUM = 2,
    HIGH = 3
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

    @ManyToOne(() => User, (user) => user.eventsGroups)
    public owner: Relation<User>;
}

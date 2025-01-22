import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
import { User } from "./user.entity.js";
import { CalendarEventGroup } from "./calendarEventGroup.entity.js";

@Entity()
export class CalendarEvent {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    start: Date;

    @Column()
    end: Date;

    @ManyToMany(() => CalendarEventGroup)
    @JoinTable()
    groups: Relation<CalendarEventGroup[]>;

    @ManyToOne(() => User)
    owner: Relation<User>
}
import { Column, Entity, JoinTable, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
import { CalendarEvent } from "./calendarEvent.entity.js";
import { CalendarEventGroup } from "./calendarEventGroup.entity.js";
import { Course } from "./course.entity.js";
import { Session } from "./session.entity.js";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    givenName: string;

    @Column()
    middleName: string;

    @Column()
    familyName: string;

    @Column({ unique: true })
    studentNo: number;

    @OneToMany(() => CalendarEvent, (evnt) => evnt.owner)
    events: Relation<CalendarEvent[]>;

    @OneToMany(() => CalendarEventGroup, (evntGroup) => evntGroup.owner)
    eventsGroups: Relation<CalendarEventGroup[]>;

    @ManyToMany(() => Course)
    @JoinTable()
    courses: Relation<Course[]>;

    @OneToOne(() => Session)
    session: Relation<Session>;
}

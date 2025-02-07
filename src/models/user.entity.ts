import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
import { CalendarEvent } from "./calendarEvent.entity.js";
import { CalendarEventGroup } from "./calendarEventGroup.entity.js";
import { Course } from "./course.entity.js";
import { Session } from "./session.entity.js";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public givenName: string;

    @Column()
    public middleName: string;

    @Column()
    public familyName: string;

    @Column({ unique: true })
    public studentNo: number;
    
    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    public created: Date;

    @OneToMany(() => CalendarEvent, (evnt) => evnt.owner)
    public events: Relation<CalendarEvent[]>;

    @OneToMany(() => CalendarEventGroup, (evntGroup) => evntGroup.owner)
    public eventsGroups: Relation<CalendarEventGroup[]>;

    @ManyToMany(() => Course)
    @JoinTable()
    public courses: Relation<Course[]>;

    @OneToOne(() => Session)
    public session: Relation<Session>;
}

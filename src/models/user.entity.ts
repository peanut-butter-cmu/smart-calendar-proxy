import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn, Relation, Index, UpdateDateColumn } from "typeorm";
import { CalendarEvent } from "./calendarEvent.entity.js";
import { CalendarEventGroup } from "./calendarEventGroup.entity.js";
import { Course } from "./course.entity.js";
import { Session } from "./session.entity.js";
import { SharedEventGroup } from "./sharedEventGroup.entity.js";
import { Notification } from "./notification.entity.js";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({ length: 100 })
    @Index()
    public givenName: string;

    @Column({ length: 100, nullable: true })
    public middleName: string;

    @Column({ length: 100 })
    @Index()
    public familyName: string;

    @Column({ unique: true, type: 'bigint' })
    @Index()
    public studentNo: number;
    
    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    public createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    public updatedAt: Date;

    @OneToMany(() => CalendarEvent, (evnt) => evnt.owner, { cascade: true })
    public events: Relation<CalendarEvent[]>;

    @OneToMany(() => CalendarEventGroup, (evntGroup) => evntGroup.owner, { cascade: true })
    public eventsGroups: Relation<CalendarEventGroup[]>;

    @ManyToMany(() => Course, { onDelete: 'CASCADE' })
    @JoinTable()
    public courses: Relation<Course[]>;

    @OneToOne(() => Session, { cascade: true })
    public session: Relation<Session>;

    @OneToMany(() => SharedEventGroup, (group) => group.owner, { cascade: true })
    public sharedGroups: Relation<SharedEventGroup[]>;

    @ManyToMany(() => SharedEventGroup, (group) => group.members)
    public memberOfGroups: Relation<SharedEventGroup[]>;

    @OneToMany(() => Notification, (notification) => notification.user, { cascade: true })
    public notifications: Relation<Notification[]>;
}

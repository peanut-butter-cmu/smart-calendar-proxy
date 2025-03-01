import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, Relation, UpdateDateColumn, Check, Index } from "typeorm";
import { User } from "./user.entity.js";
import { CalendarEventGroup } from "./calendarEventGroup.entity.js";
import { CalendarEventType } from "../types/enums.js";

@Entity()
export class CalendarEvent {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({ length: 255 })
    @Index()
    public title: string;

    @Column({ enum: CalendarEventType, default: CalendarEventType.NON_SHARED })
    public type: CalendarEventType;

    @Column({ type: 'timestamp' })
    @Index()
    public start: Date;

    @Column({ type: 'timestamp' })
    @Check(`"end" >= "start"`)
    @Index()
    public end: Date;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    public created: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    public modified: Date;

    @ManyToMany(() => CalendarEventGroup, group => group.events, { onDelete: 'CASCADE' })
    @JoinTable()
    public groups: Relation<CalendarEventGroup[]>;

    @ManyToOne(() => User, user => user.events, { onDelete: 'CASCADE' })
    @Index()
    public owner: Relation<User>
}

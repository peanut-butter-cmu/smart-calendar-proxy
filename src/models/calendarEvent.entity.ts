import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity.js";
import { CalendarEventGroup } from "./calendarEventGroup.entity.js";

@Entity()
export class CalendarEvent {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public title: string;

    @Column()
    public start: Date;

    @Column()
    public end: Date;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    public created: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    public modified: Date;

    @ManyToMany(() => CalendarEventGroup)
    @JoinTable()
    public groups: Relation<CalendarEventGroup[]>;

    @ManyToOne(() => User, user => user.events)
    public owner: Relation<User>
}
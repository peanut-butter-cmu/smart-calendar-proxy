import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, Relation, UpdateDateColumn, Check, Index } from "typeorm";
import { User } from "./User.entity.js";
import { CalendarEventGroup } from "./EventGroup.entity.js";

@Entity()
export class CalendarEvent {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({ length: 255 })
    @Index()
    public title: string;

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

    @Column({ default: false })
    public readOnly: boolean;

    @ManyToOne(() => User, user => user.events, { onDelete: 'CASCADE' })
    @Index()
    public owner: Relation<User>
}

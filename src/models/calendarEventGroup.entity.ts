import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Relation } from "typeorm";
import { User } from "./user.entity.js";

@Entity()
export class CalendarEventGroup {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public title: string;

    @Column()
    public system: boolean;

    @ManyToOne(() => User, (user) => user.eventsGroups)
    public owner: Relation<User>;
}

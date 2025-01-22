import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Relation } from "typeorm";
import { User } from "./user.entity.js";

@Entity()
export class CalendarEventGroup {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    system: boolean;

    @ManyToOne(() => User, (user) => user.eventsGroups)
    owner: Relation<User>;
}

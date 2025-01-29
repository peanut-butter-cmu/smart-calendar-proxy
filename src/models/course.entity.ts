import { Entity, PrimaryColumn, Column, Relation, ManyToMany, JoinTable } from "typeorm";
import { User } from "./user.entity.js";

@Entity()
export class Course {
    @PrimaryColumn()
    code: string;

    @PrimaryColumn()
    lecSection: string;

    @PrimaryColumn()
    labSection: string;

    @Column()
    title: string;

    @ManyToMany(() => User)
    @JoinTable()
    roster: Relation<User[]>;

    @Column("int", { array: true })
    scheduleDays: number[];

    @Column()
    scheduleStart: number;

    @Column()
    scheduleEnd: number;

    @Column({ nullable: true })
    midtermExamStart: Date;

    @Column({ nullable: true })
    midtermExamEnd: Date;

    @Column({ nullable: true })
    finalExamStart: Date;

    @Column({ nullable: true })
    finalExamEnd: Date;
}

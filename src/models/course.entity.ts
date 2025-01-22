import { Entity, PrimaryColumn, Column } from "typeorm";

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

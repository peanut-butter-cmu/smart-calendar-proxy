import { Entity, PrimaryColumn, Column, Relation, ManyToMany, CreateDateColumn, UpdateDateColumn, Check, Index } from "typeorm";
import { User } from "./User.entity.js";

@Entity()
export class Course {
    @PrimaryColumn({ length: 6 })
    @Index()
    public code: string;

    @PrimaryColumn({ length: 3 })
    public lecSection: string;

    @PrimaryColumn({ length: 3 })
    public labSection: string;

    @Column({ length: 255 })
    public title: string;

    @ManyToMany(() => User)
    public roster: Relation<User[]>;

    @Column("int", { array: true })
    @Check(`"scheduleDays"::int[] <@ ARRAY[0,1,2,3,4,5,6]`)
    public scheduleDays: number[];

    @Column()
    public scheduleStart: number;

    @Column()
    @Check(`"scheduleEnd" >= "scheduleStart"`)
    public scheduleEnd: number;

    @Column({ type: 'timestamp', nullable: true })
    public midtermExamStart: Date;

    @Column({ type: 'timestamp', nullable: true })
    @Check(`"midtermExamEnd" > "midtermExamStart" OR ("midtermExamEnd" IS NULL AND "midtermExamStart" IS NULL)`)
    public midtermExamEnd: Date;

    @Column({ type: 'timestamp', nullable: true })
    public finalExamStart: Date;

    @Column({ type: 'timestamp', nullable: true })
    @Check(`"finalExamEnd" > "finalExamStart" OR ("finalExamEnd" IS NULL AND "finalExamStart" IS NULL)`)
    public finalExamEnd: Date;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    public created: Date;
    
    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    public modified: Date;
}

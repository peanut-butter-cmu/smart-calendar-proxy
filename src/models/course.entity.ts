import { Entity, PrimaryColumn, Column, Relation, ManyToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity.js";

@Entity()
export class Course {
    @PrimaryColumn()
    public code: string;

    @PrimaryColumn()
    public lecSection: string;

    @PrimaryColumn()
    public labSection: string;

    @Column()
    public title: string;

    @ManyToMany(() => User)
    public roster: Relation<User[]>;

    @Column("int", { array: true })
    public scheduleDays: number[];

    @Column()
    public scheduleStart: number;

    @Column()
    public scheduleEnd: number;

    @Column({ nullable: true })
    public midtermExamStart: Date;

    @Column({ nullable: true })
    public midtermExamEnd: Date;

    @Column({ nullable: true })
    public finalExamStart: Date;

    @Column({ nullable: true })
    public finalExamEnd: Date;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    public created: Date;
    
    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    public modified: Date;
}

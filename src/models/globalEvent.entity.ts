import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

export enum GlobalEventType {
    CMU = "CMU",
    HOLIDAY = "HOLIDAY"
}

@Entity()
export class GlobalEvent {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    uid: string;
    @Column()
    title: string;

    @Column()
    start: Date;

    @Column()
    end: Date;

    @Index()
    @Column()
    type: GlobalEventType;
}

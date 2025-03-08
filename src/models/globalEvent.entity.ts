import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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
}

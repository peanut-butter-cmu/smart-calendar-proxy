import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, Relation } from "typeorm";
import { User } from "./user.entity.js";

@Entity()
export class Session {
    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    CMUUsername: string;

    @Column()
    CMUPassword: string;

    @Column()
    mangoToken: string;

    @OneToOne(() => User)
    @JoinColumn()
    owner: Relation<User>
}
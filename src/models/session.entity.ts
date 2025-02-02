import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity.js";

@Entity()
export class Session {
    @PrimaryGeneratedColumn()
    public id: string;

    @Column()
    public CMUUsername: string;

    @Column()
    public CMUPassword: string;

    @Column()
    public mangoToken: string;
    
    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    public created: Date;
    
    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    public modified: Date;

    @OneToOne(() => User)
    @JoinColumn()
    public owner: Relation<User>
}
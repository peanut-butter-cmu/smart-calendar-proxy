import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from "typeorm";
import { User } from "./User.entity.js";

@Entity()
export class Session {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public fcmToken: string;

    @Column()
    public deviceName: string;
    
    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    public created: Date;
    
    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    public modified: Date;

    @ManyToOne(() => User, (user) => user.sessions)
    @JoinColumn()
    public owner: Relation<User>
}

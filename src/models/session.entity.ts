import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from "typeorm";
import * as crypto from 'crypto';
import { User } from "./user.entity.js";

@Entity()
export class Session {
    @PrimaryGeneratedColumn()
    public id: string;

    @Column({ select: false })
    public CMUUsername: string;

    @Column({ select: false })
    public CMUPassword: string;

    @Column({ select: false })
    public mangoToken: string;

    @BeforeInsert()
    @BeforeUpdate()
    encryptSensitiveData() {
        if (this.CMUUsername)
            this.CMUUsername = this.encrypt(this.CMUUsername);
        if (this.CMUPassword)
            this.CMUPassword = this.encrypt(this.CMUPassword);
        if (this.mangoToken)
            this.mangoToken = this.encrypt(this.mangoToken);
    }

    private encrypt(text: string): string {
        const key = process.env.APP_ENCRYPTION_KEY || 'default-key-change-in-production';
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    }

    public decrypt(encryptedText: string): string {
        const key = process.env.APP_ENCRYPTION_KEY || 'default-key-change-in-production';
        const [ivHex, encrypted] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    
    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    public created: Date;
    
    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    public modified: Date;

    @OneToOne(() => User)
    @JoinColumn()
    public owner: Relation<User>
}

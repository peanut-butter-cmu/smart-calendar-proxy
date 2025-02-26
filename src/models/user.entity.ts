import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, Relation, Index, UpdateDateColumn, BeforeInsert, BeforeUpdate } from "typeorm";
import { CalendarEvent } from "./CalendarEvent.entity.js";
import { CalendarEventGroup } from "./EventGroup.entity.js";
import { Course } from "./Course.entity.js";
import { Session } from "./Session.entity.js";
import { Notification } from "./Notification.entity.js";
import * as crypto from 'crypto';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column({ length: 100 })
    @Index()
    public givenName: string;

    @Column({ length: 100, nullable: true })
    public middleName: string;

    @Column({ length: 100 })
    @Index()
    public familyName: string;

    @Column({ unique: true, type: 'bigint' })
    @Index()
    public studentNo: number;
    
    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)" })
    public createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP(6)", onUpdate: "CURRENT_TIMESTAMP(6)" })
    public updatedAt: Date;

    @OneToMany(() => CalendarEvent, (evnt) => evnt.owner, { cascade: true })
    public events: Relation<CalendarEvent[]>;

    @OneToMany(() => CalendarEventGroup, (evntGroup) => evntGroup.owner, { cascade: true })
    public eventsGroups: Relation<CalendarEventGroup[]>;

    @ManyToMany(() => Course, { onDelete: 'CASCADE' })
    @JoinTable()
    public courses: Relation<Course[]>;

    @OneToMany(() => Session, (session) => session.owner, { cascade: true })
    public sessions: Relation<Session[]>;

    @Column()
    @Index()
    public CMUUsername: string;

    @Column({ select: false })
    public CMUPassword: string;

    @Column({ select: false })
    public mangoToken: string;

    @BeforeInsert()
    @BeforeUpdate()
    encryptSensitiveData() {
        if (this.CMUPassword)
            this.CMUPassword = this._encrypt(this.CMUPassword);
        if (this.mangoToken)
            this.mangoToken = this._encrypt(this.mangoToken);
    }

    private _encrypt(text: string): string {
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

    @OneToMany(() => Notification, (notification) => notification.user, { cascade: true })
    public notifications: Relation<Notification[]>;
}

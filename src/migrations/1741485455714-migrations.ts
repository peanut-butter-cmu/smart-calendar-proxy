import { MigrationInterface, QueryRunner } from "typeorm";
import * as crypto from 'crypto';

export class Migrations1741485455714 implements MigrationInterface {
    private _decryptOld(encryptedText: string): string {
        if (!encryptedText || !/^[0-9a-fA-F]{32}:[0-9a-fA-F]+$/.test(encryptedText)) {
            return "";
        }
        const key = process.env.APP_ENCRYPTION_KEY || 'default-key-change-in-production';
        const [ivHex, encrypted] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    private _encryptNew(text: string): string {
        const key = process.env.APP_ENCRYPTION_KEY || 'default-key-change-in-production';
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    }

    private _decryptNew(encryptedText: string): string {
        if (!encryptedText || !/^[0-9a-fA-F]{32}:[0-9a-fA-F]+$/.test(encryptedText)) {
            return "";
        }
        const key = process.env.APP_ENCRYPTION_KEY || 'default-key-change-in-production';
        const [ivHex, encrypted] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key), iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    private _encryptOld(text: string): string {
        const key = process.env.APP_ENCRYPTION_KEY || 'default-key-change-in-production';
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Get all users with encrypted fields
        const users = await queryRunner.query(`SELECT id, "CMUPassword", "mangoToken" FROM "user"`);
        
        // Process each user
        for (const user of users) {
            // Only process if the fields exist and are encrypted
            if (user.CMUPassword) {
                const decryptedPassword = this._decryptOld(user.CMUPassword);
                if (decryptedPassword) {
                    const newEncryptedPassword = this._encryptNew(decryptedPassword);
                    await queryRunner.query(
                        `UPDATE "user" SET "CMUPassword" = $1 WHERE id = $2`,
                        [newEncryptedPassword, user.id]
                    );
                }
            }
            
            if (user.mangoToken) {
                const decryptedToken = this._decryptOld(user.mangoToken);
                if (decryptedToken) {
                    const newEncryptedToken = this._encryptNew(decryptedToken);
                    await queryRunner.query(
                        `UPDATE "user" SET "mangoToken" = $1 WHERE id = $2`,
                        [newEncryptedToken, user.id]
                    );
                }
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Get all users with encrypted fields
        const users = await queryRunner.query(`SELECT id, "CMUPassword", "mangoToken" FROM "user"`);
        
        // Process each user
        for (const user of users) {
            // Only process if the fields exist and are encrypted
            if (user.CMUPassword) {
                const decryptedPassword = this._decryptNew(user.CMUPassword);
                if (decryptedPassword) {
                    const oldEncryptedPassword = this._encryptOld(decryptedPassword);
                    await queryRunner.query(
                        `UPDATE "user" SET "CMUPassword" = $1 WHERE id = $2`,
                        [oldEncryptedPassword, user.id]
                    );
                }
            }
            
            if (user.mangoToken) {
                const decryptedToken = this._decryptNew(user.mangoToken);
                if (decryptedToken) {
                    const oldEncryptedToken = this._encryptOld(decryptedToken);
                    await queryRunner.query(
                        `UPDATE "user" SET "mangoToken" = $1 WHERE id = $2`,
                        [oldEncryptedToken, user.id]
                    );
                }
            }
        }
    }
}

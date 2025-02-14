import { MigrationInterface, QueryRunner } from "typeorm";
import * as crypto from 'crypto';

export class Migration1739556178346 implements MigrationInterface {
    name = 'Migration1739556178346'

    private encrypt(text: string): string {
        const key = process.env.APP_ENCRYPTION_KEY || 'default-key-change-in-production';
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    }

    private decrypt(encryptedText: string): string {
        const key = process.env.APP_ENCRYPTION_KEY || 'default-key-change-in-production';
        const [ivHex, encrypted] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        const sessions = await queryRunner.query(`SELECT id, "CMUUsername", "CMUPassword", "mangoToken" FROM session`);
        for (const session of sessions) {
            const updates = [];
            const params: any[] = [];
            let paramIndex = 1;
            if (session.CMUUsername) {
                updates.push(`"CMUUsername" = $${paramIndex}`);
                params.push(this.encrypt(session.CMUUsername));
                paramIndex++;
            }
            if (session.CMUPassword) {
                updates.push(`"CMUPassword" = $${paramIndex}`);
                params.push(this.encrypt(session.CMUPassword));
                paramIndex++;
            }
            if (session.mangoToken) {
                updates.push(`"mangoToken" = $${paramIndex}`);
                params.push(this.encrypt(session.mangoToken));
                paramIndex++;
            }
            if (updates.length > 0) {
                await queryRunner.query(
                    `UPDATE session SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
                    [...params, session.id]
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const sessions = await queryRunner.query(`SELECT id, "CMUUsername", "CMUPassword", "mangoToken" FROM session`);
        for (const session of sessions) {
            const updates = [];
            const params: any[] = [];
            let paramIndex = 1;
            if (session.CMUUsername) {
                updates.push(`"CMUUsername" = $${paramIndex}`);
                params.push(this.decrypt(session.CMUUsername));
                paramIndex++;
            }
            if (session.CMUPassword) {
                updates.push(`"CMUPassword" = $${paramIndex}`);
                params.push(this.decrypt(session.CMUPassword));
                paramIndex++;
            }
            if (session.mangoToken) {
                updates.push(`"mangoToken" = $${paramIndex}`);
                params.push(this.decrypt(session.mangoToken));
                paramIndex++;
            }
            if (updates.length > 0) {
                await queryRunner.query(
                    `UPDATE session SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
                    [...params, session.id]
                );
            }
        }
    }
}

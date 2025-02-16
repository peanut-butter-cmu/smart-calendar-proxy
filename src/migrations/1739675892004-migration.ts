import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1739675892004 implements MigrationInterface {
    name = 'Migration1739675892004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calendar_event_group" DROP CONSTRAINT "CHK_5c84f23f5380c449400328f2b1"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ADD CONSTRAINT "CHK_5c84f23f5380c449400328f2b1" CHECK (((color)::text ~ '^rgb((?:0|[1-9]d|1dd|2[0-4]d|25[0-5]),s*(?:0|[1-9]d|1dd|2[0-4]d|25[0-5]),s*(?:0|[1-9]d|1dd|2[0-4]d|25[0-5]))$'::text))`);
    }

}

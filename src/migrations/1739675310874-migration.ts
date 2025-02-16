import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1739675310874 implements MigrationInterface {
    name = 'Migration1739675310874'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calendar_event_group" DROP CONSTRAINT "CHK_34df066aa5c4504c5993cff499"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ADD CONSTRAINT "CHK_5c84f23f5380c449400328f2b1" CHECK ("color" ~ '^rgb\((?:0|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]),\s*(?:0|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]),\s*(?:0|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\)$')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calendar_event_group" DROP CONSTRAINT "CHK_5c84f23f5380c449400328f2b1"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ADD CONSTRAINT "CHK_34df066aa5c4504c5993cff499" CHECK (((color)::text ~ '^rgb([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]),s*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]),s*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])$'::text))`);
    }

}

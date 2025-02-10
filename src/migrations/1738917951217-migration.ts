import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1738917951217 implements MigrationInterface {
    name = 'Migration1738917951217'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ADD "color" character varying`);
        await queryRunner.query(`UPDATE "calendar_event_group" SET "color" = 'rgb(255,255,255)'`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ALTER COLUMN "color" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ADD "priority" integer`);
        await queryRunner.query(`UPDATE "calendar_event_group" SET "priority" = 2`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ALTER COLUMN "priority" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ADD "isBusy" boolean`);
        await queryRunner.query(`UPDATE "calendar_event_group" SET "isBusy" = false`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ALTER COLUMN "isBusy" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calendar_event_group" DROP COLUMN "color"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" DROP COLUMN "isBusy"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" DROP COLUMN "priority"`);
    }

}

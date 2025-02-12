import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1739339309892 implements MigrationInterface {
    name = 'Migration1739339309892'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ADD "reminders" integer array`);
        await queryRunner.query(`UPDATE "calendar_event_group" SET "reminders" = '{}'`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ALTER COLUMN "reminders" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calendar_event_group" DROP COLUMN "reminders"`);
    }

}

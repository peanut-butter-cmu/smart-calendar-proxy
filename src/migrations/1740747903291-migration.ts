import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1740747903291 implements MigrationInterface {
    name = 'Migration1740747903291'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calendar_event" ADD "type" character varying NOT NULL DEFAULT 'non_shared'`);
        await queryRunner.query(`ALTER TABLE "session" ADD CONSTRAINT "UQ_6ef59b5c7479a5c5078bdbafd7f" UNIQUE ("fcmToken")`);
        await queryRunner.query(`ALTER TYPE "public"."shared_event_status_enum" RENAME TO "shared_event_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."shared_event_status_enum" AS ENUM('pending', 'arranged', 'saved', 'deleted')`);
        await queryRunner.query(`ALTER TABLE "shared_event" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "shared_event" ALTER COLUMN "status" TYPE "public"."shared_event_status_enum" USING "status"::"text"::"public"."shared_event_status_enum"`);
        await queryRunner.query(`ALTER TABLE "shared_event" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."shared_event_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."shared_event_status_enum_old" AS ENUM('pending', 'arranged', 'deleted')`);
        await queryRunner.query(`ALTER TABLE "shared_event" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "shared_event" ALTER COLUMN "status" TYPE "public"."shared_event_status_enum_old" USING "status"::"text"::"public"."shared_event_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "shared_event" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."shared_event_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."shared_event_status_enum_old" RENAME TO "shared_event_status_enum"`);
        await queryRunner.query(`ALTER TABLE "session" DROP CONSTRAINT "UQ_6ef59b5c7479a5c5078bdbafd7f"`);
        await queryRunner.query(`ALTER TABLE "calendar_event" DROP COLUMN "type"`);
    }

}

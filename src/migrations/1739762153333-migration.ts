import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1739762153333 implements MigrationInterface {
    name = 'Migration1739762153333'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."shared_event_status_enum" AS ENUM('pending', 'arranged', 'deleted')`);
        await queryRunner.query(`ALTER TABLE "shared_event" ADD "status" "public"."shared_event_status_enum" NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "shared_event" ADD "duration" integer`);
        await queryRunner.query(`UPDATE "shared_event" SET "duration" = 30`); // avoid not null constraint by set 30 min default
        await queryRunner.query(`ALTER TABLE "shared_event" ALTER COLUMN "duration" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shared_event" DROP COLUMN "duration"`);
        await queryRunner.query(`ALTER TABLE "shared_event" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."shared_event_status_enum"`);
    }

}

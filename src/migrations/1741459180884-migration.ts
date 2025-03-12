import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1741459180884 implements MigrationInterface {
    name = 'Migration1741459180884'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "global_event" ADD "type" character varying`);
        await queryRunner.query(`UPDATE "global_event" SET "type" = 'CMU'`);
        await queryRunner.query(`ALTER TABLE "global_event" ALTER COLUMN "type" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_6c34115163afe5cf9825a8bfa1" ON "global_event" ("type") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_6c34115163afe5cf9825a8bfa1"`);
        await queryRunner.query(`ALTER TABLE "global_event" DROP COLUMN "type"`);
    }

}

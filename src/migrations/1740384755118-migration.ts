import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1740384755118 implements MigrationInterface {
    name = 'Migration1740384755118'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_eacd7769fa21f8a37c8b921530" ON "user" ("CMUUsername") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_eacd7769fa21f8a37c8b921530"`);
    }

}

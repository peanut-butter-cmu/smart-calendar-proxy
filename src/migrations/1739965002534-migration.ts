import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1739965002534 implements MigrationInterface {
    name = 'Migration1739965002534'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`TRUNCATE "session" RESTART IDENTITY CASCADE`);
        await queryRunner.query(`ALTER TABLE "session" ADD "deviceName" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "deviceName"`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1741425792152 implements MigrationInterface {
    name = 'Migration1741425792152'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "global_event" ("id" SERIAL NOT NULL, "uid" character varying NOT NULL, "title" character varying NOT NULL, "start" TIMESTAMP NOT NULL, "end" TIMESTAMP NOT NULL, CONSTRAINT "UQ_a18c92fc1857af0efac50aed621" UNIQUE ("uid"), CONSTRAINT "PK_7c7af46f414fdcfcbd4b2b06f6c" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "global_event"`);
    }

}

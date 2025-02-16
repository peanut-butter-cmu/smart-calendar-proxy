import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1739675064371 implements MigrationInterface {
    name = 'Migration1739675064371'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "course" DROP CONSTRAINT "CHK_b4ff92eda9f0ea74de41ed267c"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "givenName" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "familyName" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "studentNo" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "course" ADD CONSTRAINT "CHK_2f513f0b52d4cea76a428bab97" CHECK ("scheduleEnd" >= "scheduleStart")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "course" DROP CONSTRAINT "CHK_2f513f0b52d4cea76a428bab97"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "studentNo" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "familyName" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "givenName" SET DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "course" ADD CONSTRAINT "CHK_b4ff92eda9f0ea74de41ed267c" CHECK (("scheduleEnd" > "scheduleStart"))`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1738409784416 implements MigrationInterface {
    name = 'Migration1738409784416'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "calendar_event_group" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "system" boolean NOT NULL, "ownerId" integer, CONSTRAINT "PK_f3892f2fdede8ff45d4a94aaaf6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "calendar_event" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "start" TIMESTAMP NOT NULL, "end" TIMESTAMP NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "modified" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "ownerId" integer, CONSTRAINT "PK_176fe24e6eb48c3fef696c7641f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "course" ("code" character varying NOT NULL, "lecSection" character varying NOT NULL, "labSection" character varying NOT NULL, "title" character varying NOT NULL, "scheduleDays" integer array NOT NULL, "scheduleStart" integer NOT NULL, "scheduleEnd" integer NOT NULL, "midtermExamStart" TIMESTAMP, "midtermExamEnd" TIMESTAMP, "finalExamStart" TIMESTAMP, "finalExamEnd" TIMESTAMP, "created" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "modified" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, CONSTRAINT "PK_8f787d99e7f8560b6c6ab922664" PRIMARY KEY ("code", "lecSection", "labSection"))`);
        await queryRunner.query(`CREATE TABLE "session" ("id" SERIAL NOT NULL, "CMUUsername" character varying NOT NULL, "CMUPassword" character varying NOT NULL, "mangoToken" character varying NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "modified" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "ownerId" integer, CONSTRAINT "REL_e1dde0bd0402cc9b1967c40a1b" UNIQUE ("ownerId"), CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "givenName" character varying NOT NULL, "middleName" character varying NOT NULL, "familyName" character varying NOT NULL, "studentNo" integer NOT NULL, "created" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, CONSTRAINT "UQ_88b93f60baa5df3e6a89d8ee0d4" UNIQUE ("studentNo"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "calendar_event_groups_calendar_event_group" ("calendarEventId" integer NOT NULL, "calendarEventGroupId" integer NOT NULL, CONSTRAINT "PK_e7958a0bda75eea53fe8eb96e64" PRIMARY KEY ("calendarEventId", "calendarEventGroupId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cf39e0cde1bbcb4e88e7dd383b" ON "calendar_event_groups_calendar_event_group" ("calendarEventId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d6b134200cbcd612e0ee1955ba" ON "calendar_event_groups_calendar_event_group" ("calendarEventGroupId") `);
        await queryRunner.query(`CREATE TABLE "user_courses_course" ("userId" integer NOT NULL, "courseCode" character varying NOT NULL, "courseLecSection" character varying NOT NULL, "courseLabSection" character varying NOT NULL, CONSTRAINT "PK_8e20280702fb880969487f04a82" PRIMARY KEY ("userId", "courseCode", "courseLecSection", "courseLabSection"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e99d8f99eff1a45a772b11060e" ON "user_courses_course" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_29960e217ad85aadd93f31908f" ON "user_courses_course" ("courseCode", "courseLecSection", "courseLabSection") `);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ADD CONSTRAINT "FK_232c7fb7b3a6e279416da634f46" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calendar_event" ADD CONSTRAINT "FK_a7ac80d698e18c0d5989d5d2847" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "session" ADD CONSTRAINT "FK_e1dde0bd0402cc9b1967c40a1b3" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calendar_event_groups_calendar_event_group" ADD CONSTRAINT "FK_cf39e0cde1bbcb4e88e7dd383bd" FOREIGN KEY ("calendarEventId") REFERENCES "calendar_event"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "calendar_event_groups_calendar_event_group" ADD CONSTRAINT "FK_d6b134200cbcd612e0ee1955ba3" FOREIGN KEY ("calendarEventGroupId") REFERENCES "calendar_event_group"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "FK_e99d8f99eff1a45a772b11060e5" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "FK_29960e217ad85aadd93f31908fc" FOREIGN KEY ("courseCode", "courseLecSection", "courseLabSection") REFERENCES "course"("code","lecSection","labSection") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "FK_29960e217ad85aadd93f31908fc"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "FK_e99d8f99eff1a45a772b11060e5"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_groups_calendar_event_group" DROP CONSTRAINT "FK_d6b134200cbcd612e0ee1955ba3"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_groups_calendar_event_group" DROP CONSTRAINT "FK_cf39e0cde1bbcb4e88e7dd383bd"`);
        await queryRunner.query(`ALTER TABLE "session" DROP CONSTRAINT "FK_e1dde0bd0402cc9b1967c40a1b3"`);
        await queryRunner.query(`ALTER TABLE "calendar_event" DROP CONSTRAINT "FK_a7ac80d698e18c0d5989d5d2847"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" DROP CONSTRAINT "FK_232c7fb7b3a6e279416da634f46"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_29960e217ad85aadd93f31908f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e99d8f99eff1a45a772b11060e"`);
        await queryRunner.query(`DROP TABLE "user_courses_course"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d6b134200cbcd612e0ee1955ba"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cf39e0cde1bbcb4e88e7dd383b"`);
        await queryRunner.query(`DROP TABLE "calendar_event_groups_calendar_event_group"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "session"`);
        await queryRunner.query(`DROP TABLE "course"`);
        await queryRunner.query(`DROP TABLE "calendar_event"`);
        await queryRunner.query(`DROP TABLE "calendar_event_group"`);
    }

}

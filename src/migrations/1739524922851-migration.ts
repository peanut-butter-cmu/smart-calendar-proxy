import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1739524922851 implements MigrationInterface {
    name = 'Migration1739524922851'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ADD COLUMN "title_new" character varying(255)`);
        await queryRunner.query(`UPDATE "calendar_event_group" SET "title_new" = "title"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" RENAME COLUMN "title_new" TO "title"`);
        await queryRunner.query(`UPDATE "calendar_event_group" SET "title" = 'Untitled Group' WHERE "title" IS NULL`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ALTER COLUMN "title" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ALTER COLUMN "system" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ADD COLUMN "color_new" character varying(18)`);
        await queryRunner.query(`UPDATE "calendar_event_group" SET "color_new" = "color"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" DROP COLUMN "color"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" RENAME COLUMN "color_new" TO "color"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ALTER COLUMN "color" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ADD COLUMN "priority_new" integer`);
        await queryRunner.query(`UPDATE "calendar_event_group" SET "priority_new" = "priority"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" DROP COLUMN "priority"`);
        await queryRunner.query(`CREATE TYPE "public"."calendar_event_group_priority_enum" AS ENUM('1', '2', '3')`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ADD COLUMN "priority" "public"."calendar_event_group_priority_enum"`);
        await queryRunner.query(`UPDATE "calendar_event_group" SET "priority" = CASE 
            WHEN "priority_new" = 1 THEN '1'::calendar_event_group_priority_enum
            WHEN "priority_new" = 3 THEN '3'::calendar_event_group_priority_enum
            ELSE '2'::calendar_event_group_priority_enum
        END`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" DROP COLUMN "priority_new"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ALTER COLUMN "priority" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ALTER COLUMN "isBusy" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ALTER COLUMN "reminders" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "calendar_event" ADD COLUMN "title_new" character varying(255)`);
        await queryRunner.query(`UPDATE "calendar_event" SET "title_new" = "title"`);
        await queryRunner.query(`ALTER TABLE "calendar_event" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "calendar_event" RENAME COLUMN "title_new" TO "title"`);
        await queryRunner.query(`UPDATE "calendar_event" SET "title" = 'Untitled Event' WHERE "title" IS NULL`);
        await queryRunner.query(`ALTER TABLE "calendar_event" ALTER COLUMN "title" SET NOT NULL`);
        
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "FK_29960e217ad85aadd93f31908fc"`);
        await queryRunner.query(`ALTER TABLE "course" ADD COLUMN "lecSection_new" character varying(3)`);
        await queryRunner.query(`UPDATE "course" SET "lecSection_new" = "lecSection"`);
        await queryRunner.query(`ALTER TABLE "course" DROP COLUMN "lecSection"`);
        await queryRunner.query(`ALTER TABLE "course" RENAME COLUMN "lecSection_new" TO "lecSection"`);

        await queryRunner.query(`ALTER TABLE "course" ADD COLUMN "labSection_new" character varying(3)`);
        await queryRunner.query(`UPDATE "course" SET "labSection_new" = "labSection"`);
        await queryRunner.query(`ALTER TABLE "course" DROP COLUMN "labSection"`);
        await queryRunner.query(`ALTER TABLE "course" RENAME COLUMN "labSection_new" TO "labSection"`);
        await queryRunner.query(`ALTER TABLE "course" ADD COLUMN "code_new" character varying(6)`);
        await queryRunner.query(`UPDATE "course" SET "code_new" = "code"`);
        await queryRunner.query(`ALTER TABLE "course" DROP COLUMN "code"`);
        await queryRunner.query(`ALTER TABLE "course" RENAME COLUMN "code_new" TO "code"`);
        await queryRunner.query(`UPDATE "course" SET "code" = 'TEMP' WHERE "code" IS NULL`);
        await queryRunner.query(`ALTER TABLE "course" ALTER COLUMN "code" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "course" ADD CONSTRAINT "PK_8f787d99e7f8560b6c6ab922664" PRIMARY KEY ("code", "lecSection", "labSection")`);
        await queryRunner.query(`ALTER TABLE "course" ADD COLUMN "title_new" character varying(255)`);
        await queryRunner.query(`UPDATE "course" SET "title_new" = "title"`);
        await queryRunner.query(`ALTER TABLE "course" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "course" RENAME COLUMN "title_new" TO "title"`);
        await queryRunner.query(`UPDATE "course" SET "title" = 'Untitled Course' WHERE "title" IS NULL`);
        await queryRunner.query(`ALTER TABLE "course" ALTER COLUMN "title" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "course" ADD COLUMN "scheduleStart_new" integer`);
        await queryRunner.query(`UPDATE "course" SET "scheduleStart_new" = "scheduleStart"`);
        await queryRunner.query(`ALTER TABLE "course" DROP COLUMN "scheduleStart"`);
        await queryRunner.query(`ALTER TABLE "course" RENAME COLUMN "scheduleStart_new" TO "scheduleStart"`);
        await queryRunner.query(`UPDATE "course" SET "scheduleStart" = '0' WHERE "scheduleStart" IS NULL`);
        await queryRunner.query(`ALTER TABLE "course" ALTER COLUMN "scheduleStart" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "course" ADD COLUMN "scheduleEnd_new" integer`);
        await queryRunner.query(`UPDATE "course" SET "scheduleEnd_new" = "scheduleEnd"`);
        await queryRunner.query(`ALTER TABLE "course" DROP COLUMN "scheduleEnd"`);
        await queryRunner.query(`ALTER TABLE "course" RENAME COLUMN "scheduleEnd_new" TO "scheduleEnd"`);
        await queryRunner.query(`UPDATE "course" SET "scheduleEnd" = '0' WHERE "scheduleEnd" IS NULL`);
        await queryRunner.query(`ALTER TABLE "course" ALTER COLUMN "scheduleEnd" SET NOT NULL`);

        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD COLUMN "courseCode_new" character varying(6)`);
        await queryRunner.query(`UPDATE "user_courses_course" SET "courseCode_new" = "courseCode"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP COLUMN "courseCode"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" RENAME COLUMN "courseCode_new" TO "courseCode"`);

        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD COLUMN "courseLecSection_new" character varying(3)`);
        await queryRunner.query(`UPDATE "user_courses_course" SET "courseLecSection_new" = "courseLecSection"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP COLUMN "courseLecSection"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" RENAME COLUMN "courseLecSection_new" TO "courseLecSection"`);

        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD COLUMN "courseLabSection_new" character varying(3)`);
        await queryRunner.query(`UPDATE "user_courses_course" SET "courseLabSection_new" = "courseLabSection"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP COLUMN "courseLabSection"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" RENAME COLUMN "courseLabSection_new" TO "courseLabSection"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_8e20280702fb880969487f04a82" PRIMARY KEY ("userId", "courseCode", "courseLecSection", "courseLabSection")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "FK_29960e217ad85aadd93f31908fc" FOREIGN KEY ("courseCode", "courseLecSection", "courseLabSection") REFERENCES "course"("code","lecSection","labSection") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`CREATE INDEX "IDX_29960e217ad85aadd93f31908f" ON "user_courses_course" ("courseCode", "courseLabSection", "courseLecSection")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "FK_29960e217ad85aadd93f31908fc"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_groups_calendar_event_group" DROP CONSTRAINT "FK_d6b134200cbcd612e0ee1955ba3"`);
        await queryRunner.query(`ALTER TABLE "calendar_event" DROP CONSTRAINT "FK_a7ac80d698e18c0d5989d5d2847"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" DROP CONSTRAINT "FK_232c7fb7b3a6e279416da634f46"`);
        await queryRunner.query(`ALTER TABLE "course" DROP CONSTRAINT "CHK_7d9d475721ab8532a37c867917"`);
        await queryRunner.query(`ALTER TABLE "course" DROP CONSTRAINT "CHK_3352f50640b17905446cdc9a4b"`);
        await queryRunner.query(`ALTER TABLE "course" DROP CONSTRAINT "CHK_b4ff92eda9f0ea74de41ed267c"`);
        await queryRunner.query(`ALTER TABLE "course" DROP CONSTRAINT "CHK_6b4120f1c752bbd621f05affc7"`);
        await queryRunner.query(`ALTER TABLE "calendar_event" DROP CONSTRAINT "CHK_8582688c4d5d8fe4ded35392c8"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" DROP CONSTRAINT "CHK_4ac41395cefe200350150e3ec5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_29960e217ad85aadd93f31908f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_88b93f60baa5df3e6a89d8ee0d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_72aa0a9b34cd8c5a9390ee94f1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e467bf43fc969a88e9eebb29e1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5cf4963ae12285cda6432d5a3a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a7ac80d698e18c0d5989d5d284"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5a7aa17a0c4d9a8fefdb3a7b1d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ddba6a0abecf11a9e26742326d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_caf4951f9a664ba624036e0f6a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_232c7fb7b3a6e279416da634f4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_09a04655b97ab632fc6d379239"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_8e20280702fb880969487f04a82"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_7c7b88b0c63dbc7103afa2b8f1e" PRIMARY KEY ("userId", "courseCode", "courseLecSection")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP COLUMN "courseLabSection"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD "courseLabSection" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_7c7b88b0c63dbc7103afa2b8f1e"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_8e20280702fb880969487f04a82" PRIMARY KEY ("userId", "courseLabSection", "courseCode", "courseLecSection")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_8e20280702fb880969487f04a82"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_73ba132f730f1dfe925af49169b" PRIMARY KEY ("userId", "courseLabSection", "courseCode")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP COLUMN "courseLecSection"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD "courseLecSection" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_73ba132f730f1dfe925af49169b"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_8e20280702fb880969487f04a82" PRIMARY KEY ("userId", "courseLecSection", "courseLabSection", "courseCode")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_8e20280702fb880969487f04a82"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_cd89d4a5cb4e71140a2f59941c2" PRIMARY KEY ("userId", "courseLecSection", "courseLabSection")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP COLUMN "courseCode"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD "courseCode" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_cd89d4a5cb4e71140a2f59941c2"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_8e20280702fb880969487f04a82" PRIMARY KEY ("userId", "courseCode", "courseLecSection", "courseLabSection")`);
        await queryRunner.query(`CREATE INDEX "IDX_29960e217ad85aadd93f31908f" ON "user_courses_course" ("courseCode", "courseLabSection", "courseLecSection") `);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_88b93f60baa5df3e6a89d8ee0d4"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "studentNo"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "studentNo" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_88b93f60baa5df3e6a89d8ee0d4" UNIQUE ("studentNo")`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "familyName"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "familyName" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "middleName"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "middleName" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "givenName"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "givenName" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "course" DROP COLUMN "scheduleEnd"`);
        await queryRunner.query(`ALTER TABLE "course" ADD "scheduleEnd" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "course" DROP COLUMN "scheduleStart"`);
        await queryRunner.query(`ALTER TABLE "course" ADD "scheduleStart" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "course" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "course" ADD "title" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "course" DROP CONSTRAINT "PK_8f787d99e7f8560b6c6ab922664"`);
        await queryRunner.query(`ALTER TABLE "course" ADD CONSTRAINT "PK_eabe4ba2a82e366f339694a5881" PRIMARY KEY ("code", "lecSection")`);
        await queryRunner.query(`ALTER TABLE "course" DROP COLUMN "labSection"`);
        await queryRunner.query(`ALTER TABLE "course" ADD "labSection" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "course" DROP CONSTRAINT "PK_eabe4ba2a82e366f339694a5881"`);
        await queryRunner.query(`ALTER TABLE "course" ADD CONSTRAINT "PK_8f787d99e7f8560b6c6ab922664" PRIMARY KEY ("labSection", "code", "lecSection")`);
        await queryRunner.query(`ALTER TABLE "course" DROP CONSTRAINT "PK_8f787d99e7f8560b6c6ab922664"`);
        await queryRunner.query(`ALTER TABLE "course" ADD CONSTRAINT "PK_b09352103fe8f47a552a5e36bf4" PRIMARY KEY ("labSection", "code")`);
        await queryRunner.query(`ALTER TABLE "course" DROP COLUMN "lecSection"`);
        await queryRunner.query(`ALTER TABLE "course" ADD "lecSection" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "course" DROP CONSTRAINT "PK_b09352103fe8f47a552a5e36bf4"`);
        await queryRunner.query(`ALTER TABLE "course" ADD CONSTRAINT "PK_8f787d99e7f8560b6c6ab922664" PRIMARY KEY ("lecSection", "labSection", "code")`);
        await queryRunner.query(`ALTER TABLE "course" DROP CONSTRAINT "PK_8f787d99e7f8560b6c6ab922664"`);
        await queryRunner.query(`ALTER TABLE "course" ADD CONSTRAINT "PK_f48ceb87a4c33ecbd19f112b6d1" PRIMARY KEY ("lecSection", "labSection")`);
        await queryRunner.query(`ALTER TABLE "course" DROP COLUMN "code"`);
        await queryRunner.query(`ALTER TABLE "course" ADD "code" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "course" DROP CONSTRAINT "PK_f48ceb87a4c33ecbd19f112b6d1"`);
        await queryRunner.query(`ALTER TABLE "course" ADD CONSTRAINT "PK_8f787d99e7f8560b6c6ab922664" PRIMARY KEY ("code", "lecSection", "labSection")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "FK_29960e217ad85aadd93f31908fc" FOREIGN KEY ("courseCode", "courseLecSection", "courseLabSection") REFERENCES "course"("code","lecSection","labSection") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "calendar_event" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "calendar_event" ADD "title" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ALTER COLUMN "reminders" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ALTER COLUMN "isBusy" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" DROP COLUMN "priority"`);
        await queryRunner.query(`DROP TYPE "public"."calendar_event_group_priority_enum"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ADD "priority" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" DROP COLUMN "color"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ADD "color" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ALTER COLUMN "system" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ADD "title" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "calendar_event_groups_calendar_event_group" ADD CONSTRAINT "FK_d6b134200cbcd612e0ee1955ba3" FOREIGN KEY ("calendarEventGroupId") REFERENCES "calendar_event_group"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "calendar_event" ADD CONSTRAINT "FK_a7ac80d698e18c0d5989d5d2847" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ADD CONSTRAINT "FK_232c7fb7b3a6e279416da634f46" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}

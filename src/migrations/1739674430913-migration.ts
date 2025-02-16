import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1739674430913 implements MigrationInterface {
    name = 'Migration1739674430913'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "calendar_event_group" DROP CONSTRAINT "FK_232c7fb7b3a6e279416da634f46"`);
        await queryRunner.query(`ALTER TABLE "calendar_event" DROP CONSTRAINT "FK_a7ac80d698e18c0d5989d5d2847"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_groups_calendar_event_group" DROP CONSTRAINT "FK_d6b134200cbcd612e0ee1955ba3"`);
        await queryRunner.query(`CREATE TYPE "public"."shared_group_invite_status_enum" AS ENUM('pending', 'accepted', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "shared_group_invite" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "status" "public"."shared_group_invite_status_enum" NOT NULL DEFAULT 'pending', "token" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "groupId" integer, CONSTRAINT "PK_ecc230869659fe92664d8fa405e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_662d391ec4c23a133eaa80cac5" ON "shared_group_invite" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_1aa23e10dbfefdc9e88ba9b8c1" ON "shared_group_invite" ("token") `);
        await queryRunner.query(`CREATE TYPE "public"."shared_event_group_priority_enum" AS ENUM('1', '2', '3')`);
        await queryRunner.query(`CREATE TABLE "shared_event_group" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "color" character varying(18) NOT NULL, "priority" "public"."shared_event_group_priority_enum" NOT NULL, "reminders" integer array NOT NULL DEFAULT '{}', "idealDays" character varying array NOT NULL, "idealTimeRanges" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "ownerId" integer, CONSTRAINT "CHK_c9b847812b9962a5e16580e38f" CHECK ("color" ~ '^rgb([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]),\s*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]),\s*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])$'), CONSTRAINT "PK_edd28d2ee9adfc014a338947619" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4d4f7ce02299650e394cca6dad" ON "shared_event_group" ("title") `);
        await queryRunner.query(`CREATE INDEX "IDX_a2df15cc70ee77aec9b4d32442" ON "shared_event_group" ("ownerId") `);
        await queryRunner.query(`CREATE TYPE "public"."notification_type_enum" AS ENUM('group_invite', 'invite_accepted', 'invite_rejected', 'member_added', 'member_removed', 'meeting_scheduled')`);
        await queryRunner.query(`CREATE TABLE "notification" ("id" SERIAL NOT NULL, "type" "public"."notification_type_enum" NOT NULL, "data" jsonb NOT NULL, "read" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "userId" integer, CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1ced25315eb974b73391fb1c81" ON "notification" ("userId") `);
        await queryRunner.query(`CREATE TABLE "shared_event_group_members_user" ("sharedEventGroupId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_09110a95f9cca3da595f81a465a" PRIMARY KEY ("sharedEventGroupId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d94f1178ac3633131bd0dc1c13" ON "shared_event_group_members_user" ("sharedEventGroupId") `);
        await queryRunner.query(`CREATE INDEX "IDX_28c344e4755504574a55df67a8" ON "shared_event_group_members_user" ("userId") `);
        await queryRunner.query(`CREATE TABLE "shared_event_group_events_calendar_event" ("sharedEventGroupId" integer NOT NULL, "calendarEventId" integer NOT NULL, CONSTRAINT "PK_4d8808ac7af309e40206e386d43" PRIMARY KEY ("sharedEventGroupId", "calendarEventId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_acf89d0d33f0499fe1791baa5a" ON "shared_event_group_events_calendar_event" ("sharedEventGroupId") `);
        await queryRunner.query(`CREATE INDEX "IDX_2cb7be0419b9fb047319267691" ON "shared_event_group_events_calendar_event" ("calendarEventId") `);

        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "createdAt_temp" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`UPDATE "user" SET "createdAt_temp" = "created"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "created"`);
        await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "createdAt_temp" TO "createdAt"`);

        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "updatedAt_temp" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone`);
        await queryRunner.query(`UPDATE "user" SET "updatedAt_temp" = 'now'`);
        await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "updatedAt_temp" TO "updatedAt"`);

        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "givenName_temp" character varying(100) NOT NULL DEFAULT ''`);
        await queryRunner.query(`UPDATE "user" SET "givenName_temp" = "givenName"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "givenName"`);
        await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "givenName_temp" TO "givenName"`)

        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "middleName_temp" character varying(100)`);
        await queryRunner.query(`UPDATE "user" SET "middleName_temp" = "middleName"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "middleName"`);
        await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "middleName_temp" TO "middleName"`);

        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "familyName_temp" character varying(100) NOT NULL DEFAULT ''`);
        await queryRunner.query(`UPDATE "user" SET "familyName_temp" = "familyName"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "familyName"`);
        await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "familyName_temp" TO "familyName"`);
        
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_88b93f60baa5df3e6a89d8ee0d4"`);
        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "studentNo_temp" bigint NOT NULL DEFAULT 0`);
        await queryRunner.query(`UPDATE "user" SET "studentNo_temp" = "studentNo"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "studentNo"`);
        await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "studentNo_temp" TO "studentNo"`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_88b93f60baa5df3e6a89d8ee0d4" UNIQUE ("studentNo")`);

        await queryRunner.query(`CREATE INDEX "IDX_09a04655b97ab632fc6d379239" ON "calendar_event_group" ("title") `);
        await queryRunner.query(`CREATE INDEX "IDX_232c7fb7b3a6e279416da634f4" ON "calendar_event_group" ("ownerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_caf4951f9a664ba624036e0f6a" ON "calendar_event" ("title") `);
        await queryRunner.query(`CREATE INDEX "IDX_ddba6a0abecf11a9e26742326d" ON "calendar_event" ("start") `);
        await queryRunner.query(`CREATE INDEX "IDX_5a7aa17a0c4d9a8fefdb3a7b1d" ON "calendar_event" ("end") `);
        await queryRunner.query(`CREATE INDEX "IDX_a7ac80d698e18c0d5989d5d284" ON "calendar_event" ("ownerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_5cf4963ae12285cda6432d5a3a" ON "course" ("code") `);
        await queryRunner.query(`CREATE INDEX "IDX_e467bf43fc969a88e9eebb29e1" ON "user" ("givenName") `);
        await queryRunner.query(`CREATE INDEX "IDX_72aa0a9b34cd8c5a9390ee94f1" ON "user" ("familyName") `);
        await queryRunner.query(`CREATE INDEX "IDX_88b93f60baa5df3e6a89d8ee0d" ON "user" ("studentNo") `);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ADD CONSTRAINT "CHK_34df066aa5c4504c5993cff499" CHECK ("color" ~ '^rgb([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]),\s*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5]),\s*([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])$')`);
        await queryRunner.query(`ALTER TABLE "calendar_event" ADD CONSTRAINT "CHK_8582688c4d5d8fe4ded35392c8" CHECK ("end" > "start")`);
        await queryRunner.query(`ALTER TABLE "course" ADD CONSTRAINT "CHK_6b4120f1c752bbd621f05affc7" CHECK ("scheduleDays"::int[] <@ ARRAY[0,1,2,3,4,5,6])`);
        await queryRunner.query(`ALTER TABLE "course" ADD CONSTRAINT "CHK_b4ff92eda9f0ea74de41ed267c" CHECK ("scheduleEnd" > "scheduleStart")`);
        await queryRunner.query(`ALTER TABLE "course" ADD CONSTRAINT "CHK_3352f50640b17905446cdc9a4b" CHECK ("midtermExamEnd" > "midtermExamStart" OR ("midtermExamEnd" IS NULL AND "midtermExamStart" IS NULL))`);
        await queryRunner.query(`ALTER TABLE "course" ADD CONSTRAINT "CHK_7d9d475721ab8532a37c867917" CHECK ("finalExamEnd" > "finalExamStart" OR ("finalExamEnd" IS NULL AND "finalExamStart" IS NULL))`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ADD CONSTRAINT "FK_232c7fb7b3a6e279416da634f46" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calendar_event" ADD CONSTRAINT "FK_a7ac80d698e18c0d5989d5d2847" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shared_group_invite" ADD CONSTRAINT "FK_a8c92883ba3aa407aac0eec844a" FOREIGN KEY ("groupId") REFERENCES "shared_event_group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shared_event_group" ADD CONSTRAINT "FK_a2df15cc70ee77aec9b4d324426" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_1ced25315eb974b73391fb1c81b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calendar_event_groups_calendar_event_group" ADD CONSTRAINT "FK_d6b134200cbcd612e0ee1955ba3" FOREIGN KEY ("calendarEventGroupId") REFERENCES "calendar_event_group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "shared_event_group_members_user" ADD CONSTRAINT "FK_d94f1178ac3633131bd0dc1c132" FOREIGN KEY ("sharedEventGroupId") REFERENCES "shared_event_group"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "shared_event_group_members_user" ADD CONSTRAINT "FK_28c344e4755504574a55df67a8c" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "shared_event_group_events_calendar_event" ADD CONSTRAINT "FK_acf89d0d33f0499fe1791baa5a3" FOREIGN KEY ("sharedEventGroupId") REFERENCES "shared_event_group"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "shared_event_group_events_calendar_event" ADD CONSTRAINT "FK_2cb7be0419b9fb047319267691a" FOREIGN KEY ("calendarEventId") REFERENCES "calendar_event"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shared_event_group_events_calendar_event" DROP CONSTRAINT "FK_2cb7be0419b9fb047319267691a"`);
        await queryRunner.query(`ALTER TABLE "shared_event_group_events_calendar_event" DROP CONSTRAINT "FK_acf89d0d33f0499fe1791baa5a3"`);
        await queryRunner.query(`ALTER TABLE "shared_event_group_members_user" DROP CONSTRAINT "FK_28c344e4755504574a55df67a8c"`);
        await queryRunner.query(`ALTER TABLE "shared_event_group_members_user" DROP CONSTRAINT "FK_d94f1178ac3633131bd0dc1c132"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_groups_calendar_event_group" DROP CONSTRAINT "FK_d6b134200cbcd612e0ee1955ba3"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_1ced25315eb974b73391fb1c81b"`);
        await queryRunner.query(`ALTER TABLE "shared_event_group" DROP CONSTRAINT "FK_a2df15cc70ee77aec9b4d324426"`);
        await queryRunner.query(`ALTER TABLE "shared_group_invite" DROP CONSTRAINT "FK_a8c92883ba3aa407aac0eec844a"`);
        await queryRunner.query(`ALTER TABLE "calendar_event" DROP CONSTRAINT "FK_a7ac80d698e18c0d5989d5d2847"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" DROP CONSTRAINT "FK_232c7fb7b3a6e279416da634f46"`);
        await queryRunner.query(`ALTER TABLE "course" DROP CONSTRAINT "CHK_7d9d475721ab8532a37c867917"`);
        await queryRunner.query(`ALTER TABLE "course" DROP CONSTRAINT "CHK_3352f50640b17905446cdc9a4b"`);
        await queryRunner.query(`ALTER TABLE "course" DROP CONSTRAINT "CHK_b4ff92eda9f0ea74de41ed267c"`);
        await queryRunner.query(`ALTER TABLE "course" DROP CONSTRAINT "CHK_6b4120f1c752bbd621f05affc7"`);
        await queryRunner.query(`ALTER TABLE "calendar_event" DROP CONSTRAINT "CHK_8582688c4d5d8fe4ded35392c8"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" DROP CONSTRAINT "CHK_34df066aa5c4504c5993cff499"`);
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
        
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_88b93f60baa5df3e6a89d8ee0d4"`);
        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "studentNo_temp" integer NOT NULL`);
        await queryRunner.query(`UPDATE "user" SET "studentNo_temp" = "studentNo"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "studentNo"`);
        await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "studentNo_temp" TO "studentNo"`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_88b93f60baa5df3e6a89d8ee0d4" UNIQUE ("studentNo")`);

        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "familyName_temp" character varying NOT NULL`);
        await queryRunner.query(`UPDATE "user" SET "familyName_temp" = "familyName"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "familyName"`);
        await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "familyName_temp" TO "familyName"`);

        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "middleName_temp" character varying NOT NULL`);
        await queryRunner.query(`UPDATE "user" SET "middleName_temp" = "middleName"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "middleName"`);
        await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "middleName_temp" TO "middleName"`);

        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "givenName_temp" character varying NOT NULL`);
        await queryRunner.query(`UPDATE "user" SET "givenName_temp" = "givenName"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "givenName"`);
        await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "givenName_temp" TO "givenName"`);

        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "created" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone`);

        await queryRunner.query(`DROP INDEX "public"."IDX_2cb7be0419b9fb047319267691"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_acf89d0d33f0499fe1791baa5a"`);
        await queryRunner.query(`DROP TABLE "shared_event_group_events_calendar_event"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_28c344e4755504574a55df67a8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d94f1178ac3633131bd0dc1c13"`);
        await queryRunner.query(`DROP TABLE "shared_event_group_members_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1ced25315eb974b73391fb1c81"`);
        await queryRunner.query(`DROP TABLE "notification"`);
        await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a2df15cc70ee77aec9b4d32442"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4d4f7ce02299650e394cca6dad"`);
        await queryRunner.query(`DROP TABLE "shared_event_group"`);
        await queryRunner.query(`DROP TYPE "public"."shared_event_group_priority_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1aa23e10dbfefdc9e88ba9b8c1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_662d391ec4c23a133eaa80cac5"`);
        await queryRunner.query(`DROP TABLE "shared_group_invite"`);
        await queryRunner.query(`DROP TYPE "public"."shared_group_invite_status_enum"`);
        await queryRunner.query(`ALTER TABLE "calendar_event_groups_calendar_event_group" ADD CONSTRAINT "FK_d6b134200cbcd612e0ee1955ba3" FOREIGN KEY ("calendarEventGroupId") REFERENCES "calendar_event_group"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "calendar_event" ADD CONSTRAINT "FK_a7ac80d698e18c0d5989d5d2847" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "calendar_event_group" ADD CONSTRAINT "FK_232c7fb7b3a6e279416da634f46" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}

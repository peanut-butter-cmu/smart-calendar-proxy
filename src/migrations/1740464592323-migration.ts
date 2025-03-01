import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1740464592323 implements MigrationInterface {
    name = 'Migration1740464592323'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_1ced25315eb974b73391fb1c81b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1ced25315eb974b73391fb1c81"`);
        await queryRunner.query(`ALTER TABLE "calendar_event" DROP CONSTRAINT "CHK_8582688c4d5d8fe4ded35392c8"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "deliveryType"`);
        await queryRunner.query(`DROP TYPE "public"."notification_deliverytype_enum"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "scheduledFor"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."notification_status_enum"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "retryCount"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "deliveryMetadata"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "ownerId" integer`);
        await queryRunner.query(`ALTER TABLE "calendar_event" ADD "readOnly" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "shared_event" ADD "repeat" jsonb`);
        await queryRunner.query(`ALTER TYPE "public"."notification_type_enum" RENAME TO "notification_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notification_type_enum" AS ENUM('event_created', 'event_scheduled', 'event_deleted', 'invite_accepted', 'invite_rejected', 'event_reminder')`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "type" TYPE "public"."notification_type_enum" USING "type"::"text"::"public"."notification_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_eacd7769fa21f8a37c8b9215303" UNIQUE ("CMUUsername")`);
        await queryRunner.query(`CREATE INDEX "IDX_274f7f52fe174d6f3f857ab420" ON "notification" ("ownerId") `);
        await queryRunner.query(`ALTER TABLE "calendar_event" ADD CONSTRAINT "CHK_a4ac3c63b0282e82881a7a4234" CHECK ("end" >= "start")`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_274f7f52fe174d6f3f857ab420a" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_274f7f52fe174d6f3f857ab420a"`);
        await queryRunner.query(`ALTER TABLE "calendar_event" DROP CONSTRAINT "CHK_a4ac3c63b0282e82881a7a4234"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_274f7f52fe174d6f3f857ab420"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_eacd7769fa21f8a37c8b9215303"`);
        await queryRunner.query(`CREATE TYPE "public"."notification_type_enum_old" AS ENUM('group_invite', 'invite_accepted', 'invite_rejected', 'member_added', 'member_removed', 'meeting_scheduled', 'event_deleted')`);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "type" TYPE "public"."notification_type_enum_old" USING "type"::"text"::"public"."notification_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notification_type_enum_old" RENAME TO "notification_type_enum"`);
        await queryRunner.query(`ALTER TABLE "shared_event" DROP COLUMN "repeat"`);
        await queryRunner.query(`ALTER TABLE "calendar_event" DROP COLUMN "readOnly"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "ownerId"`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "userId" integer`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "deliveryMetadata" jsonb`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "retryCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`CREATE TYPE "public"."notification_status_enum" AS ENUM('pending', 'sent', 'failed')`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "status" "public"."notification_status_enum" NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "scheduledFor" TIMESTAMP`);
        await queryRunner.query(`CREATE TYPE "public"."notification_deliverytype_enum" AS ENUM('in_app', 'email_registered', 'email_unregistered', 'fcm')`);
        await queryRunner.query(`ALTER TABLE "notification" ADD "deliveryType" "public"."notification_deliverytype_enum" NOT NULL DEFAULT 'in_app'`);
        await queryRunner.query(`ALTER TABLE "calendar_event" ADD CONSTRAINT "CHK_8582688c4d5d8fe4ded35392c8" CHECK (("end" > start))`);
        await queryRunner.query(`CREATE INDEX "IDX_1ced25315eb974b73391fb1c81" ON "notification" ("userId") `);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_1ced25315eb974b73391fb1c81b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1738896132002 implements MigrationInterface {
    name = 'Migration1738896132002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "FK_e99d8f99eff1a45a772b11060e5"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "FK_29960e217ad85aadd93f31908fc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e99d8f99eff1a45a772b11060e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_29960e217ad85aadd93f31908f"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_8e20280702fb880969487f04a82"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_29960e217ad85aadd93f31908fc" PRIMARY KEY ("courseCode", "courseLecSection", "courseLabSection")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_29960e217ad85aadd93f31908fc"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_a5dcd1a2834b6339fcc2f684093" PRIMARY KEY ("courseLecSection", "courseLabSection")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP COLUMN "courseCode"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_a5dcd1a2834b6339fcc2f684093"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_16978ddfda47773cdca71b09ca4" PRIMARY KEY ("courseLabSection")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP COLUMN "courseLecSection"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_16978ddfda47773cdca71b09ca4"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP COLUMN "courseLabSection"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD "user_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_2ec90888221fddeaadfc23a8b69" PRIMARY KEY ("user_id")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD "course_code" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_2ec90888221fddeaadfc23a8b69"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_19518e0c351f3c5d4f8e8194cbb" PRIMARY KEY ("user_id", "course_code")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD "course_lec" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_19518e0c351f3c5d4f8e8194cbb"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_819d028c6c1ad9dbf9b1a7d7567" PRIMARY KEY ("user_id", "course_code", "course_lec")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD "course_lab" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_819d028c6c1ad9dbf9b1a7d7567"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_a4bd90c081e226d4a96f96b3d48" PRIMARY KEY ("user_id", "course_code", "course_lec", "course_lab")`);
        await queryRunner.query(`CREATE INDEX "IDX_2ec90888221fddeaadfc23a8b6" ON "user_courses_course" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_20e50b4c6e123ad3dcfc90f277" ON "user_courses_course" ("course_code", "course_lec", "course_lab") `);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "FK_2ec90888221fddeaadfc23a8b69" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "FK_20e50b4c6e123ad3dcfc90f277d" FOREIGN KEY ("course_code", "course_lec", "course_lab") REFERENCES "course"("code","lecSection","labSection") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "FK_20e50b4c6e123ad3dcfc90f277d"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "FK_2ec90888221fddeaadfc23a8b69"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_20e50b4c6e123ad3dcfc90f277"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2ec90888221fddeaadfc23a8b6"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_a4bd90c081e226d4a96f96b3d48"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_819d028c6c1ad9dbf9b1a7d7567" PRIMARY KEY ("user_id", "course_code", "course_lec")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP COLUMN "course_lab"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_819d028c6c1ad9dbf9b1a7d7567"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_19518e0c351f3c5d4f8e8194cbb" PRIMARY KEY ("user_id", "course_code")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP COLUMN "course_lec"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_19518e0c351f3c5d4f8e8194cbb"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_2ec90888221fddeaadfc23a8b69" PRIMARY KEY ("user_id")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP COLUMN "course_code"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_2ec90888221fddeaadfc23a8b69"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD "courseLabSection" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_16978ddfda47773cdca71b09ca4" PRIMARY KEY ("courseLabSection")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD "courseLecSection" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_16978ddfda47773cdca71b09ca4"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_a5dcd1a2834b6339fcc2f684093" PRIMARY KEY ("courseLecSection", "courseLabSection")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD "courseCode" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_a5dcd1a2834b6339fcc2f684093"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_29960e217ad85aadd93f31908fc" PRIMARY KEY ("courseCode", "courseLecSection", "courseLabSection")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD "userId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_29960e217ad85aadd93f31908fc"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_8e20280702fb880969487f04a82" PRIMARY KEY ("userId", "courseCode", "courseLecSection", "courseLabSection")`);
        await queryRunner.query(`CREATE INDEX "IDX_29960e217ad85aadd93f31908f" ON "user_courses_course" ("courseCode", "courseLabSection", "courseLecSection") `);
        await queryRunner.query(`CREATE INDEX "IDX_e99d8f99eff1a45a772b11060e" ON "user_courses_course" ("userId") `);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "FK_29960e217ad85aadd93f31908fc" FOREIGN KEY ("courseCode", "courseLecSection", "courseLabSection") REFERENCES "course"("code","lecSection","labSection") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "FK_e99d8f99eff1a45a772b11060e5" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1738907404280 implements MigrationInterface {
    name = 'Migration1738907404280'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "FK_2ec90888221fddeaadfc23a8b69"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "FK_20e50b4c6e123ad3dcfc90f277d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2ec90888221fddeaadfc23a8b6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_20e50b4c6e123ad3dcfc90f277"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_a4bd90c081e226d4a96f96b3d48"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_20e50b4c6e123ad3dcfc90f277d" PRIMARY KEY ("course_code", "course_lec", "course_lab")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_20e50b4c6e123ad3dcfc90f277d"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_f45f7c61a3dd7041ac9658b4f34" PRIMARY KEY ("course_lec", "course_lab")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP COLUMN "course_code"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_f45f7c61a3dd7041ac9658b4f34"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_4b09d92811d6c145ab676e2a90f" PRIMARY KEY ("course_lab")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP COLUMN "course_lec"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_4b09d92811d6c145ab676e2a90f"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP COLUMN "course_lab"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD "userId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_e99d8f99eff1a45a772b11060e5" PRIMARY KEY ("userId")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD "courseCode" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_e99d8f99eff1a45a772b11060e5"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_a5383e7c18563dda922c4da04f8" PRIMARY KEY ("userId", "courseCode")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD "courseLecSection" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_a5383e7c18563dda922c4da04f8"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_7c7b88b0c63dbc7103afa2b8f1e" PRIMARY KEY ("userId", "courseCode", "courseLecSection")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD "courseLabSection" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_7c7b88b0c63dbc7103afa2b8f1e"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_8e20280702fb880969487f04a82" PRIMARY KEY ("userId", "courseCode", "courseLecSection", "courseLabSection")`);
        await queryRunner.query(`CREATE INDEX "IDX_e99d8f99eff1a45a772b11060e" ON "user_courses_course" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_29960e217ad85aadd93f31908f" ON "user_courses_course" ("courseCode", "courseLecSection", "courseLabSection") `);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "FK_e99d8f99eff1a45a772b11060e5" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "FK_29960e217ad85aadd93f31908fc" FOREIGN KEY ("courseCode", "courseLecSection", "courseLabSection") REFERENCES "course"("code","lecSection","labSection") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "FK_29960e217ad85aadd93f31908fc"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "FK_e99d8f99eff1a45a772b11060e5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_29960e217ad85aadd93f31908f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e99d8f99eff1a45a772b11060e"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_8e20280702fb880969487f04a82"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_7c7b88b0c63dbc7103afa2b8f1e" PRIMARY KEY ("userId", "courseCode", "courseLecSection")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP COLUMN "courseLabSection"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_7c7b88b0c63dbc7103afa2b8f1e"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_a5383e7c18563dda922c4da04f8" PRIMARY KEY ("userId", "courseCode")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP COLUMN "courseLecSection"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_a5383e7c18563dda922c4da04f8"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_e99d8f99eff1a45a772b11060e5" PRIMARY KEY ("userId")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP COLUMN "courseCode"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_e99d8f99eff1a45a772b11060e5"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD "course_lab" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_4b09d92811d6c145ab676e2a90f" PRIMARY KEY ("course_lab")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD "course_lec" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_4b09d92811d6c145ab676e2a90f"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_f45f7c61a3dd7041ac9658b4f34" PRIMARY KEY ("course_lec", "course_lab")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD "course_code" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_f45f7c61a3dd7041ac9658b4f34"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_20e50b4c6e123ad3dcfc90f277d" PRIMARY KEY ("course_code", "course_lec", "course_lab")`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD "user_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "PK_20e50b4c6e123ad3dcfc90f277d"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "PK_a4bd90c081e226d4a96f96b3d48" PRIMARY KEY ("user_id", "course_code", "course_lec", "course_lab")`);
        await queryRunner.query(`CREATE INDEX "IDX_20e50b4c6e123ad3dcfc90f277" ON "user_courses_course" ("course_code", "course_lab", "course_lec") `);
        await queryRunner.query(`CREATE INDEX "IDX_2ec90888221fddeaadfc23a8b6" ON "user_courses_course" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "FK_20e50b4c6e123ad3dcfc90f277d" FOREIGN KEY ("course_code", "course_lec", "course_lab") REFERENCES "course"("code","lecSection","labSection") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "FK_2ec90888221fddeaadfc23a8b69" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNewsCategoryAndDropCoverColor1787303100000 implements MigrationInterface {
  name = 'CreateNewsCategoryAndDropCoverColor1787303100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "news_category" ("name" character varying NOT NULL, "sortOrder" integer NOT NULL DEFAULT 0, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_news_category_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_news_category_sortOrder" ON "news_category" ("sortOrder")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_news_category_deletedAt" ON "news_category" ("deletedAt")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_news_category_name_active" ON "news_category" ("name") WHERE "deletedAt" IS NULL`,
    );

    await queryRunner.query(`
      INSERT INTO "news_category" ("name", "sortOrder")
      SELECT DISTINCT a."category", 0
      FROM "news_article" a
      WHERE a."category" IS NOT NULL
        AND a."category" <> ''
        AND NOT EXISTS (
          SELECT 1 FROM "news_category" c
          WHERE c.name = a."category" AND c."deletedAt" IS NULL
        )
    `);

    await queryRunner.query(`
      INSERT INTO "news_category" ("name", "sortOrder")
      SELECT v.name, v."sortOrder"
      FROM (VALUES ('Market', 0), ('Technology', 1)) AS v(name, "sortOrder")
      WHERE NOT EXISTS (
        SELECT 1 FROM "news_category" c
        WHERE c.name = v.name AND c."deletedAt" IS NULL
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "news_article" DROP COLUMN "coverColor"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "news_article" ADD "coverColor" character varying NOT NULL DEFAULT '#000000'`,
    );
    await queryRunner.query(
      `ALTER TABLE "news_article" ALTER COLUMN "coverColor" DROP DEFAULT`,
    );

    await queryRunner.query(`DROP INDEX "UQ_news_category_name_active"`);
    await queryRunner.query(`DROP INDEX "IDX_news_category_deletedAt"`);
    await queryRunner.query(`DROP INDEX "IDX_news_category_sortOrder"`);
    await queryRunner.query(`DROP TABLE "news_category"`);
  }
}

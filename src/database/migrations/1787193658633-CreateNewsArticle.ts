import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNewsArticle1787193658633 implements MigrationInterface {
  name = 'CreateNewsArticle1787193658633';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "news_article" ("coverColor" character varying NOT NULL, "sourceName" character varying NOT NULL, "sourceId" character varying NOT NULL, "publishedAt" TIMESTAMP NOT NULL, "coverImage" character varying, "category" character varying NOT NULL, "url" character varying NOT NULL, "summary" character varying NOT NULL, "title" character varying NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_news_article_url" UNIQUE ("url"), CONSTRAINT "PK_12e2ec4b5482dadc50ee88e0da1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_news_article_publishedAt" ON "news_article" ("publishedAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_news_article_category" ON "news_article" ("category")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_news_article_category"`);
    await queryRunner.query(`DROP INDEX "IDX_news_article_publishedAt"`);
    await queryRunner.query(`DROP TABLE "news_article"`);
  }
}

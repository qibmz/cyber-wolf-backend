import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewsArticleDeletedAt1787303000000 implements MigrationInterface {
  name = 'AddNewsArticleDeletedAt1787303000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "news_article" ADD "deletedAt" TIMESTAMP`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_news_article_deletedAt" ON "news_article" ("deletedAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_news_article_deletedAt"`);
    await queryRunner.query(
      `ALTER TABLE "news_article" DROP COLUMN "deletedAt"`,
    );
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUserFirstLastName1787302758084 implements MigrationInterface {
  name = 'DropUserFirstLastName1787302758084';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Backfill nickname from first/last name before dropping those columns.
    // Append id so values stay unique under UQ_user_nickname (max length 39).
    await queryRunner.query(`
      UPDATE "user"
      SET "nickname" = LOWER(
        LEFT(
          REGEXP_REPLACE(
            CONCAT(COALESCE("firstName", ''), COALESCE("lastName", '')),
            '[^a-zA-Z0-9]',
            '',
            'g'
          ),
          GREATEST(1, 39 - LENGTH(id::text))
        ) || id::text
      )
      WHERE "nickname" IS NULL
        AND (
          NULLIF(TRIM(COALESCE("firstName", '')), '') IS NOT NULL
          OR NULLIF(TRIM(COALESCE("lastName", '')), '') IS NOT NULL
        )
    `);

    await queryRunner.query(`
      UPDATE "user"
      SET "nickname" = 'user' || id::text
      WHERE "nickname" IS NULL
    `);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_58e4dbff0e1a32a9bdc861bb29"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_f0e1b4ecdca13b177e2e3a0613"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "firstName"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "lastName"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "lastName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "firstName" character varying`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f0e1b4ecdca13b177e2e3a0613" ON "user" ("lastName") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_58e4dbff0e1a32a9bdc861bb29" ON "user" ("firstName") `,
    );
  }
}

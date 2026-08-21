import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserNickname1787302518568 implements MigrationInterface {
  name = 'AddUserNickname1787302518568';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "nickname" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "UQ_user_nickname" UNIQUE ("nickname")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT "UQ_user_nickname"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "nickname"`);
  }
}

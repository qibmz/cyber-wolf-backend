import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserWalletAddress1787711697077 implements MigrationInterface {
  name = 'AddUserWalletAddress1787711697077';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "walletAddress" character varying`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_user_wallet_address" ON "user" ("walletAddress")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_user_wallet_address"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "walletAddress"`);
  }
}

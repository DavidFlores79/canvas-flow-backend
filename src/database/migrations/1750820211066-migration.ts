import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1750820211066 implements MigrationInterface {
  name = 'Migration1750820211066';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "investment_products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL, "term_days" integer NOT NULL, "annual_rate" numeric(5,2) NOT NULL, "penalty_rate" numeric(5,2) NOT NULL, "min_amount" numeric(12,2) NOT NULL, "max_amount" numeric(12,2) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7721e1a1ba3d642f93a2be7c497" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "investment_products"`);
  }
}

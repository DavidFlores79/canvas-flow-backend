import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1762321438041 implements MigrationInterface {
    name = 'Migration1762321438041'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "addresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "street" character varying(255) NOT NULL, "externalNumber" character varying(50) NOT NULL, "internalNumber" character varying(50), "city" character varying(150) NOT NULL, "suburb" character varying(150), "county" character varying(150), "state" character varying(150) NOT NULL, "zipCode" character varying(20) NOT NULL, "country" character varying(150) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_745d8f43d3af10ab8247465e450" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "first_name" character varying(150), "middle_name" character varying(150), "last_name" character varying(150), "second_last_name" character varying(150), "full_name" character varying(512), "display_name" character varying(255), "email" character varying(255), "phone" character varying(50) NOT NULL, "password" character varying(255), "gender" character varying(50), "group" character varying(50) NOT NULL, "rfc" character varying(13), "curp" character varying(18), "birth_date" date, "nationality" character varying(100), "country_of_birth" character varying(100), "state_of_birth" character varying(100), "risk_level" character varying(50), "profile_completed" boolean NOT NULL DEFAULT false, "status" character varying(50) NOT NULL, "verified" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_3dd688f49161bf5d3819b2831bd" UNIQUE ("rfc"), CONSTRAINT "UQ_55cb758111fd64952df1338e22c" UNIQUE ("curp"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_user_first_name" ON "users" ("first_name") `);
        await queryRunner.query(`CREATE INDEX "idx_user_middle_name" ON "users" ("middle_name") `);
        await queryRunner.query(`CREATE INDEX "idx_user_last_name" ON "users" ("last_name") `);
        await queryRunner.query(`CREATE INDEX "idx_user_full_name" ON "users" ("full_name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_user_phone" ON "users" ("phone") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_user_rfc" ON "users" ("rfc") WHERE "rfc" IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_user_curp" ON "users" ("curp") WHERE "curp" IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "idx_user_status" ON "users" ("status") `);
        await queryRunner.query(`CREATE TABLE "sms_validations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "sms_provider" character varying(50), "phone" character varying(50), "status" character varying(50), "sms_service_sid" character varying(100), "sms_request_sid" character varying(100), "sms_action" character varying(50), "sms_status" character varying(50), "sms_request_date" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_36c3a5fd2e8728d056313c2e2d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_sms_validation_user_id" ON "sms_validations" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_sms_validation_phone" ON "sms_validations" ("phone") `);
        await queryRunner.query(`CREATE INDEX "IDX_e99332d7f43d8cfac190644441" ON "sms_validations" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_sms_validation_sms_service_sid" ON "sms_validations" ("sms_service_sid") `);
        await queryRunner.query(`CREATE INDEX "idx_sms_validation_sms_request_sid" ON "sms_validations" ("sms_request_sid") `);
        await queryRunner.query(`ALTER TABLE "addresses" ADD CONSTRAINT "FK_95c93a584de49f0b0e13f753630" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sms_validations" ADD CONSTRAINT "FK_cb2c66c3835c99f76a16e5abb02" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sms_validations" DROP CONSTRAINT "FK_cb2c66c3835c99f76a16e5abb02"`);
        await queryRunner.query(`ALTER TABLE "addresses" DROP CONSTRAINT "FK_95c93a584de49f0b0e13f753630"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sms_validation_sms_request_sid"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sms_validation_sms_service_sid"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e99332d7f43d8cfac190644441"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sms_validation_phone"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sms_validation_user_id"`);
        await queryRunner.query(`DROP TABLE "sms_validations"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_curp"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_rfc"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_phone"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_full_name"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_last_name"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_middle_name"`);
        await queryRunner.query(`DROP INDEX "public"."idx_user_first_name"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "addresses"`);
    }

}

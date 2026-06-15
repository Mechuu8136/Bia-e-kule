import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1740000000000 implements MigrationInterface {
  name = 'InitialSchema1740000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('users')) {
      return;
    }

    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('gosc', 'mieszkaniec', 'dyrektor', 'urzednik')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."buildings_type_enum" AS ENUM('szkola', 'urzad', 'szpital', 'inny')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."meters_type_enum" AS ENUM('prad', 'woda', 'cieplo')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_buildings_link_type_enum" AS ENUM('assigned', 'favorite')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."api_keys_scope_enum" AS ENUM('organization', 'building')`,
    );

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'gosc',
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "buildings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "address" character varying NOT NULL,
        "type" "public"."buildings_type_enum" NOT NULL DEFAULT 'inny',
        "external_code" character varying,
        CONSTRAINT "UQ_buildings_external_code" UNIQUE ("external_code"),
        CONSTRAINT "PK_buildings" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "municipality_settings" (
        "id" integer NOT NULL DEFAULT 1,
        "municipality_name" character varying NOT NULL DEFAULT '',
        "tagline" character varying NOT NULL DEFAULT '',
        "air_quality_station_name" character varying NOT NULL DEFAULT 'Stacja pomiarowa — centrum gminy',
        "is_configured" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_municipality_settings" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_buildings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "building_id" uuid NOT NULL,
        "link_type" "public"."user_buildings_link_type_enum" NOT NULL DEFAULT 'assigned',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_buildings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_buildings_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_buildings_building" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "meters" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "building_id" uuid NOT NULL,
        "type" "public"."meters_type_enum" NOT NULL,
        "serial_number" character varying NOT NULL,
        "unit" character varying NOT NULL,
        CONSTRAINT "UQ_meters_serial_number" UNIQUE ("serial_number"),
        CONSTRAINT "PK_meters" PRIMARY KEY ("id"),
        CONSTRAINT "FK_meters_building" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "meter_readings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "meter_id" uuid NOT NULL,
        "timestamp" TIMESTAMP NOT NULL,
        "value" numeric(10,2) NOT NULL,
        CONSTRAINT "UQ_meter_readings_meter_timestamp" UNIQUE ("meter_id", "timestamp"),
        CONSTRAINT "PK_meter_readings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_meter_readings_meter" FOREIGN KEY ("meter_id") REFERENCES "meters"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "solar_panels" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "building_id" uuid NOT NULL,
        "capacity_kwp" numeric(8,2) NOT NULL,
        "installation_date" date NOT NULL,
        "serial_number" character varying NOT NULL,
        CONSTRAINT "UQ_solar_panels_serial_number" UNIQUE ("serial_number"),
        CONSTRAINT "PK_solar_panels" PRIMARY KEY ("id"),
        CONSTRAINT "FK_solar_panels_building" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "solar_production" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "panel_id" uuid NOT NULL,
        "timestamp" TIMESTAMP NOT NULL,
        "energy_produced_kwh" numeric(10,2) NOT NULL,
        CONSTRAINT "UQ_solar_production_panel_timestamp" UNIQUE ("panel_id", "timestamp"),
        CONSTRAINT "PK_solar_production" PRIMARY KEY ("id"),
        CONSTRAINT "FK_solar_production_panel" FOREIGN KEY ("panel_id") REFERENCES "solar_panels"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "esg_reports" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "generated_by_id" uuid,
        "building_id" uuid,
        "co2_reduction_kg" numeric(12,2) NOT NULL,
        "document_url" character varying,
        "is_public" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_esg_reports" PRIMARY KEY ("id"),
        CONSTRAINT "FK_esg_reports_user" FOREIGN KEY ("generated_by_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_esg_reports_building" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "announcements" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" character varying NOT NULL,
        "body" text NOT NULL,
        "is_published" boolean NOT NULL DEFAULT true,
        "published_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_announcements" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "air_quality_readings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "station_name" character varying NOT NULL DEFAULT 'Stacja pomiarowa — centrum gminy',
        "pm25" numeric(6,2) NOT NULL,
        "pm10" numeric(6,2) NOT NULL,
        "timestamp" TIMESTAMP NOT NULL,
        CONSTRAINT "PK_air_quality_readings" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "api_keys" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "key_hash" character varying NOT NULL,
        "key_prefix" character varying(16) NOT NULL,
        "scope" "public"."api_keys_scope_enum" NOT NULL DEFAULT 'organization',
        "building_id" uuid,
        "is_active" boolean NOT NULL DEFAULT true,
        "rate_limit_per_minute" integer NOT NULL DEFAULT 100,
        "created_by_id" uuid,
        "last_used_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_api_keys" PRIMARY KEY ("id"),
        CONSTRAINT "FK_api_keys_building" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_api_keys_user" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_meter_readings_meter_timestamp" ON "meter_readings" ("meter_id", "timestamp")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_solar_production_panel_timestamp" ON "solar_production" ("panel_id", "timestamp")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_air_quality_station_timestamp" ON "air_quality_readings" ("station_name", "timestamp")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_air_quality_station_timestamp"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_solar_production_panel_timestamp"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_meter_readings_meter_timestamp"`);
    await queryRunner.query(`DROP TABLE "api_keys"`);
    await queryRunner.query(`DROP TABLE "air_quality_readings"`);
    await queryRunner.query(`DROP TABLE "announcements"`);
    await queryRunner.query(`DROP TABLE "esg_reports"`);
    await queryRunner.query(`DROP TABLE "solar_production"`);
    await queryRunner.query(`DROP TABLE "solar_panels"`);
    await queryRunner.query(`DROP TABLE "meter_readings"`);
    await queryRunner.query(`DROP TABLE "meters"`);
    await queryRunner.query(`DROP TABLE "user_buildings"`);
    await queryRunner.query(`DROP TABLE "municipality_settings"`);
    await queryRunner.query(`DROP TABLE "buildings"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."api_keys_scope_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_buildings_link_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."meters_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."buildings_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}

CREATE TYPE "public"."organ_condition" AS ENUM('healthy', 'unhealthy', 'unknown');--> statement-breakpoint
ALTER TABLE "organs" ALTER COLUMN "condition" SET DATA TYPE organ_condition;--> statement-breakpoint
ALTER TABLE "organs" ALTER COLUMN "condition" SET DEFAULT 'healthy';--> statement-breakpoint
ALTER TABLE "organs" ALTER COLUMN "condition" SET NOT NULL;
-- ---------------------------------------------------------------------------
-- 🚀 LifeBridge Production Schema Migration
-- Generated for PostgreSQL (Drizzle ORM compatible)
-- ---------------------------------------------------------------------------

-- ================================
-- ENUMS
-- ================================
CREATE TYPE "user_role" AS ENUM ('admin', 'coordinator', 'surgeon', 'transport');
CREATE TYPE "donor_status" AS ENUM ('active', 'inactive', 'eligible', 'ineligible', 'unknown');
CREATE TYPE "consent_status" AS ENUM ('pending', 'consented', 'withdrawn');
CREATE TYPE "organ_status" AS ENUM ('available', 'allocated', 'discarded', 'transplanted');
CREATE TYPE "allocation_status" AS ENUM ('proposed', 'accepted', 'declined', 'expired');
CREATE TYPE "transport_status" AS ENUM ('scheduled', 'in_progress', 'completed', 'failed');
CREATE TYPE "transport_mode" AS ENUM ('ground', 'commercial_flight', 'charter_flight', 'helicopter', 'drone');

-- ================================
-- SESSIONS
-- ================================
CREATE TABLE "sessions" (
  "sid" varchar PRIMARY KEY,
  "sess" jsonb NOT NULL,
  "expire" timestamptz NOT NULL
);
CREATE INDEX "idx_sessions_expire" ON "sessions" ("expire");

-- ================================
-- USERS
-- ================================
CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" varchar UNIQUE NOT NULL,
  "first_name" varchar,
  "last_name" varchar,
  "profile_image_url" varchar,
  "role" "user_role" NOT NULL DEFAULT 'coordinator',
  "department" varchar,
  "organization" varchar,
  "hospital_id" varchar,
  "phone_number" varchar,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- ================================
-- DONORS
-- ================================
CREATE TABLE "donors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "unos_id" varchar UNIQUE,
  "first_name" varchar,
  "last_name" varchar,
  "date_of_birth" timestamptz,
  "blood_type" varchar NOT NULL,
  "age" integer,
  "weight" numeric(5,2),
  "height" numeric(5,2),
  "location" varchar NOT NULL,
  "hospital_id" varchar,
  "status" "donor_status" NOT NULL DEFAULT 'active',
  "consent_status" "consent_status" NOT NULL DEFAULT 'pending',
  "medical_history" jsonb,
  "hla_type" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "idx_donors_status" ON "donors" ("status");
CREATE INDEX "idx_donors_consent_status" ON "donors" ("consent_status");

-- ================================
-- RECIPIENTS
-- ================================
CREATE TABLE "recipients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "unos_id" varchar UNIQUE,
  "first_name" varchar,
  "last_name" varchar,
  "blood_type" varchar NOT NULL,
  "organ_needed" varchar NOT NULL,
  "urgency_status" varchar NOT NULL,
  "waitlist_date" timestamptz NOT NULL,
  "location" varchar NOT NULL,
  "hospital_id" varchar,
  "medical_data" jsonb,
  "hla_type" jsonb,
  "antibodies" jsonb,
  "meld_score" integer,
  "cpc_score" integer,
  "status" varchar NOT NULL DEFAULT 'waiting',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "idx_recipients_status" ON "recipients" ("status");

-- ================================
-- ORGANS
-- ================================
CREATE TABLE "organs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "donor_id" uuid NOT NULL REFERENCES "donors"("id") ON DELETE CASCADE,
  "organ_type" varchar NOT NULL,
  "blood_type" varchar NOT NULL,
  "status" "organ_status" NOT NULL DEFAULT 'available',
  "viability_hours" integer NOT NULL,
  "preservation_start_time" timestamptz NOT NULL,
  "viability_deadline" timestamptz NOT NULL,
  "current_location" varchar,
  "temperature" numeric(4,2),
  "preservation_solution" varchar,
  "quality_score" varchar,
  "biopsy_results" jsonb,
  "crossmatch_data" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "idx_organs_status" ON "organs" ("status");
CREATE INDEX "idx_organs_blood_type" ON "organs" ("blood_type");

-- ================================
-- ALLOCATIONS
-- ================================
CREATE TABLE "allocations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organ_id" uuid NOT NULL REFERENCES "organs"("id") ON DELETE CASCADE,
  "recipient_id" uuid NOT NULL REFERENCES "recipients"("id") ON DELETE CASCADE,
  "match_score" numeric(5,2) NOT NULL,
  "compatibility_data" jsonb,
  "status" "allocation_status" NOT NULL DEFAULT 'proposed',
  "proposed_at" timestamptz NOT NULL DEFAULT now(),
  "responded_at" timestamptz,
  "responded_by" uuid REFERENCES "users"("id"),
  "decline_reason" text,
  "priority" integer NOT NULL DEFAULT 1
);
CREATE INDEX "idx_allocations_status" ON "allocations" ("status");

-- ================================
-- TRANSPORTS
-- ================================
CREATE TABLE "transports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organ_id" uuid NOT NULL REFERENCES "organs"("id") ON DELETE CASCADE,
  "allocation_id" uuid REFERENCES "allocations"("id") ON DELETE SET NULL,
  "transport_mode" "transport_mode" NOT NULL,
  "status" "transport_status" NOT NULL DEFAULT 'scheduled',
  "origin_location" varchar NOT NULL,
  "destination_location" varchar NOT NULL,
  "scheduled_pickup" timestamptz NOT NULL,
  "scheduled_delivery" timestamptz NOT NULL,
  "actual_pickup" timestamptz,
  "actual_delivery" timestamptz,
  "courier_id" uuid REFERENCES "users"("id"),
  "carrier_info" jsonb,
  "tracking_number" varchar,
  "current_gps_lat" numeric(9,6),
  "current_gps_lng" numeric(9,6),
  "backup_plan" jsonb,
  "weather_impact" varchar,
  "cost_estimate" numeric(10,2),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "idx_transports_status" ON "transports" ("status");

-- ================================
-- MESSAGES
-- ================================
CREATE TABLE "messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "allocation_id" uuid REFERENCES "allocations"("id") ON DELETE CASCADE,
  "transport_id" uuid REFERENCES "transports"("id") ON DELETE CASCADE,
  "sender_id" uuid NOT NULL REFERENCES "users"("id"),
  "message_type" varchar NOT NULL,
  "content" text NOT NULL,
  "attachment_url" varchar,
  "priority" varchar NOT NULL DEFAULT 'normal',
  "is_read" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- ================================
-- CUSTODY LOGS
-- ================================
CREATE TABLE "custody_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organ_id" uuid NOT NULL REFERENCES "organs"("id") ON DELETE CASCADE,
  "action" varchar NOT NULL,
  "performed_by" uuid NOT NULL REFERENCES "users"("id"),
  "location" varchar NOT NULL,
  "timestamp" timestamptz NOT NULL DEFAULT now(),
  "temperature" numeric(4,2),
  "notes" text,
  "signature" varchar
);

-- ================================
-- METRICS
-- ================================
CREATE TABLE "metrics" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "metric_type" varchar NOT NULL,
  "organ_type" varchar,
  "value" numeric(10,2) NOT NULL,
  "period" varchar NOT NULL,
  "date" timestamptz NOT NULL,
  "metadata" jsonb
);

-- ================================
-- AUDIT LOGS
-- ================================
CREATE TABLE "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid REFERENCES "users"("id"),
  "user_email" varchar,
  "user_role" varchar,
  "user_name" varchar,
  "session_id" varchar NOT NULL,
  "ip_address" varchar NOT NULL,
  "user_agent" text,
  "http_method" varchar,
  "endpoint" varchar,
  "action" varchar NOT NULL,
  "action_category" varchar NOT NULL,
  "entity_type" varchar,
  "entity_id" uuid,
  "previous_values" jsonb,
  "new_values" jsonb,
  "changed_fields" jsonb,
  "query_params" jsonb,
  "result_count" integer,
  "success" boolean NOT NULL DEFAULT true,
  "error_message" text,
  "error_code" varchar,
  "timestamp" timestamptz NOT NULL DEFAULT now(),
  "metadata" jsonb,
  "phi_accessed" boolean NOT NULL DEFAULT false,
  "export_format" varchar,
  "export_record_count" integer
);
CREATE INDEX "idx_audit_logs_timestamp" ON "audit_logs" ("timestamp");
CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs" ("user_id");
CREATE INDEX "idx_audit_logs_entity" ON "audit_logs" ("entity_type", "entity_id");

-- ================================
-- AUTH AUDIT LOGS
-- ================================
CREATE TABLE "auth_audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid REFERENCES "users"("id"),
  "user_email" varchar,
  "attempted_email" varchar,
  "event_type" varchar NOT NULL,
  "event_status" varchar NOT NULL,
  "session_id" varchar,
  "ip_address" varchar NOT NULL,
  "user_agent" text,
  "failure_reason" varchar,
  "consecutive_failures" integer DEFAULT 0,
  "mfa_used" boolean DEFAULT false,
  "login_method" varchar,
  "previous_role" varchar,
  "new_role" varchar,
  "changed_by" uuid REFERENCES "users"("id"),
  "timestamp" timestamptz NOT NULL DEFAULT now(),
  "metadata" jsonb
);
CREATE INDEX "idx_auth_audit_timestamp" ON "auth_audit_logs" ("timestamp");

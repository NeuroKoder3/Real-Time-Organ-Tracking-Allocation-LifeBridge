CREATE TABLE "allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organ_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"match_score" numeric(5, 2) NOT NULL,
	"compatibility_data" jsonb,
	"status" varchar DEFAULT 'proposed' NOT NULL,
	"proposed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone,
	"responded_by" uuid,
	"decline_reason" text,
	"priority" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
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
	"success" boolean DEFAULT true NOT NULL,
	"error_message" text,
	"error_code" varchar,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb,
	"phi_accessed" boolean DEFAULT false NOT NULL,
	"export_format" varchar,
	"export_record_count" integer
);
--> statement-breakpoint
CREATE TABLE "auth_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
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
	"changed_by" uuid,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "custody_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organ_id" uuid NOT NULL,
	"action" varchar NOT NULL,
	"performed_by" uuid NOT NULL,
	"location" varchar NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"temperature" numeric(4, 2),
	"notes" text,
	"signature" varchar
);
--> statement-breakpoint
CREATE TABLE "donors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unos_id" varchar,
	"blood_type" varchar NOT NULL,
	"age" integer,
	"weight" numeric(5, 2),
	"height" numeric(5, 2),
	"location" varchar NOT NULL,
	"hospital_id" varchar,
	"status" varchar DEFAULT 'active' NOT NULL,
	"consent_status" varchar NOT NULL,
	"medical_history" jsonb,
	"hla_type" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "donors_unos_id_unique" UNIQUE("unos_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"allocation_id" uuid,
	"transport_id" uuid,
	"sender_id" uuid NOT NULL,
	"message_type" varchar NOT NULL,
	"content" text NOT NULL,
	"attachment_url" varchar,
	"priority" varchar DEFAULT 'normal' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_type" varchar NOT NULL,
	"organ_type" varchar,
	"value" numeric(10, 2) NOT NULL,
	"period" varchar NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "organs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"donor_id" uuid NOT NULL,
	"organ_type" varchar NOT NULL,
	"blood_type" varchar NOT NULL,
	"status" varchar DEFAULT 'available' NOT NULL,
	"viability_hours" integer NOT NULL,
	"preservation_start_time" timestamp with time zone NOT NULL,
	"viability_deadline" timestamp with time zone NOT NULL,
	"current_location" varchar,
	"temperature" numeric(4, 2),
	"preservation_solution" varchar,
	"quality_score" varchar,
	"biopsy_results" jsonb,
	"crossmatch_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unos_id" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"blood_type" varchar NOT NULL,
	"organ_needed" varchar NOT NULL,
	"urgency_status" varchar NOT NULL,
	"waitlist_date" timestamp with time zone NOT NULL,
	"location" varchar NOT NULL,
	"hospital_id" varchar,
	"medical_data" jsonb,
	"hla_type" jsonb,
	"antibodies" jsonb,
	"meld_score" integer,
	"cpc_score" integer,
	"status" varchar DEFAULT 'waiting' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recipients_unos_id_unique" UNIQUE("unos_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organ_id" uuid NOT NULL,
	"allocation_id" uuid,
	"transport_mode" varchar NOT NULL,
	"status" varchar DEFAULT 'scheduled' NOT NULL,
	"origin_location" varchar NOT NULL,
	"destination_location" varchar NOT NULL,
	"scheduled_pickup" timestamp with time zone NOT NULL,
	"scheduled_delivery" timestamp with time zone NOT NULL,
	"actual_pickup" timestamp with time zone,
	"actual_delivery" timestamp with time zone,
	"courier_id" uuid,
	"carrier_info" jsonb,
	"tracking_number" varchar,
	"current_gps_lat" numeric(9, 6),
	"current_gps_lng" numeric(9, 6),
	"backup_plan" jsonb,
	"weather_impact" varchar,
	"cost_estimate" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" varchar DEFAULT 'coordinator' NOT NULL,
	"department" varchar,
	"organization" varchar,
	"hospital_id" varchar,
	"phone_number" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_organ_id_organs_id_fk" FOREIGN KEY ("organ_id") REFERENCES "public"."organs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_recipient_id_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."recipients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_responded_by_users_id_fk" FOREIGN KEY ("responded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_audit_logs" ADD CONSTRAINT "auth_audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_audit_logs" ADD CONSTRAINT "auth_audit_logs_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custody_logs" ADD CONSTRAINT "custody_logs_organ_id_organs_id_fk" FOREIGN KEY ("organ_id") REFERENCES "public"."organs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custody_logs" ADD CONSTRAINT "custody_logs_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_allocation_id_allocations_id_fk" FOREIGN KEY ("allocation_id") REFERENCES "public"."allocations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_transport_id_transports_id_fk" FOREIGN KEY ("transport_id") REFERENCES "public"."transports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organs" ADD CONSTRAINT "organs_donor_id_donors_id_fk" FOREIGN KEY ("donor_id") REFERENCES "public"."donors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transports" ADD CONSTRAINT "transports_organ_id_organs_id_fk" FOREIGN KEY ("organ_id") REFERENCES "public"."organs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transports" ADD CONSTRAINT "transports_allocation_id_allocations_id_fk" FOREIGN KEY ("allocation_id") REFERENCES "public"."allocations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transports" ADD CONSTRAINT "transports_courier_id_users_id_fk" FOREIGN KEY ("courier_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_logs_timestamp" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_entity" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_action_category" ON "audit_logs" USING btree ("action_category");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_session_id" ON "audit_logs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_phi_accessed" ON "audit_logs" USING btree ("phi_accessed");--> statement-breakpoint
CREATE INDEX "idx_auth_audit_timestamp" ON "auth_audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_auth_audit_user_id" ON "auth_audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_auth_audit_event_type" ON "auth_audit_logs" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_auth_audit_ip_address" ON "auth_audit_logs" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "idx_auth_audit_session_id" ON "auth_audit_logs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_expire" ON "sessions" USING btree ("expire");
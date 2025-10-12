ALTER TABLE "transports" ALTER COLUMN "origin_location" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transports" ALTER COLUMN "destination_location" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transports" ALTER COLUMN "scheduled_pickup" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transports" ALTER COLUMN "scheduled_delivery" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transports" ALTER COLUMN "courier_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "allocations" ADD COLUMN "courier_id" uuid;--> statement-breakpoint
ALTER TABLE "organs" ADD COLUMN "condition" varchar;--> statement-breakpoint
ALTER TABLE "recipients" ADD COLUMN "hospital" varchar;--> statement-breakpoint
ALTER TABLE "transports" ADD COLUMN "start_location" varchar;--> statement-breakpoint
ALTER TABLE "transports" ADD COLUMN "end_location" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_courier_id_users_id_fk" FOREIGN KEY ("courier_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
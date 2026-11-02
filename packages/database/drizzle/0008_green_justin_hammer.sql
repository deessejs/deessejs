CREATE TABLE "organization_avatars" (
	"organization_id" text PRIMARY KEY NOT NULL,
	"object_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_avatars_object_id_unique" UNIQUE("object_id")
);
--> statement-breakpoint
CREATE TABLE "storage_objects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"object_key" text NOT NULL,
	"state" text DEFAULT 'pending' NOT NULL,
	"content_type" text,
	"byte_size" integer,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_at" timestamp with time zone,
	"cleanup_after" timestamp with time zone,
	CONSTRAINT "storage_objects_object_key_unique" UNIQUE("object_key"),
	CONSTRAINT "storage_objects_state_check" CHECK ("storage_objects"."state" IN ('pending', 'ready', 'delete_pending')),
	CONSTRAINT "storage_objects_ready_metadata_check" CHECK ("storage_objects"."state" <> 'ready' OR ("storage_objects"."content_type" = 'image/webp' AND "storage_objects"."byte_size" IS NOT NULL AND "storage_objects"."verified_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "storage_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"object_id" uuid NOT NULL,
	"staged_key" text NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text,
	"expected_content_type" text NOT NULL,
	"expected_byte_size" integer NOT NULL,
	"state" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"cleanup_after" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "storage_uploads_object_id_unique" UNIQUE("object_id"),
	CONSTRAINT "storage_uploads_staged_key_unique" UNIQUE("staged_key"),
	CONSTRAINT "storage_uploads_state_check" CHECK ("storage_uploads"."state" IN ('pending', 'promoted', 'delete_pending')),
	CONSTRAINT "storage_uploads_expected_byte_size_check" CHECK ("storage_uploads"."expected_byte_size" > 0)
);
--> statement-breakpoint
CREATE TABLE "user_avatars" (
	"user_id" text PRIMARY KEY NOT NULL,
	"object_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_avatars_object_id_unique" UNIQUE("object_id")
);
--> statement-breakpoint
ALTER TABLE "organization_avatars" ADD CONSTRAINT "organization_avatars_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_avatars" ADD CONSTRAINT "organization_avatars_object_id_storage_objects_id_fk" FOREIGN KEY ("object_id") REFERENCES "public"."storage_objects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_objects" ADD CONSTRAINT "storage_objects_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_uploads" ADD CONSTRAINT "storage_uploads_object_id_storage_objects_id_fk" FOREIGN KEY ("object_id") REFERENCES "public"."storage_objects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_uploads" ADD CONSTRAINT "storage_uploads_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_uploads" ADD CONSTRAINT "storage_uploads_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_avatars" ADD CONSTRAINT "user_avatars_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_avatars" ADD CONSTRAINT "user_avatars_object_id_storage_objects_id_fk" FOREIGN KEY ("object_id") REFERENCES "public"."storage_objects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "storage_objects_cleanup_idx" ON "storage_objects" USING btree ("cleanup_after");--> statement-breakpoint
CREATE INDEX "storage_uploads_cleanup_idx" ON "storage_uploads" USING btree ("cleanup_after");
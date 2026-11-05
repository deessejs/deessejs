-- 0009 is recorded in some deployed migration histories without its image
-- objects. Reconcile those databases while remaining safe on a fully migrated DB.
CREATE TABLE IF NOT EXISTS "template_image_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"object_id" uuid NOT NULL,
	"staged_key" text NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text,
	"expected_content_type" text NOT NULL,
	"expected_byte_size" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "template_image_uploads_object_id_unique" UNIQUE("object_id"),
	CONSTRAINT "template_image_uploads_staged_key_unique" UNIQUE("staged_key")
);--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "image_object_id" uuid;--> statement-breakpoint
ALTER TABLE "template_publications" ADD COLUMN IF NOT EXISTS "image_object_id" uuid;--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'template_image_uploads_template_id_templates_id_fk') THEN ALTER TABLE "template_image_uploads" ADD CONSTRAINT "template_image_uploads_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE cascade; END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'template_image_uploads_object_id_storage_objects_id_fk') THEN ALTER TABLE "template_image_uploads" ADD CONSTRAINT "template_image_uploads_object_id_storage_objects_id_fk" FOREIGN KEY ("object_id") REFERENCES "storage_objects"("id") ON DELETE cascade; END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'template_image_uploads_user_id_user_id_fk') THEN ALTER TABLE "template_image_uploads" ADD CONSTRAINT "template_image_uploads_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade; END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'template_image_uploads_organization_id_organization_id_fk') THEN ALTER TABLE "template_image_uploads" ADD CONSTRAINT "template_image_uploads_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE cascade; END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'templates_image_object_id_storage_objects_id_fk') THEN ALTER TABLE "templates" ADD CONSTRAINT "templates_image_object_id_storage_objects_id_fk" FOREIGN KEY ("image_object_id") REFERENCES "storage_objects"("id") ON DELETE restrict; END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'template_publications_image_object_id_storage_objects_id_fk') THEN ALTER TABLE "template_publications" ADD CONSTRAINT "template_publications_image_object_id_storage_objects_id_fk" FOREIGN KEY ("image_object_id") REFERENCES "storage_objects"("id") ON DELETE restrict; END IF;
END $$;

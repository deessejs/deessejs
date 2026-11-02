ALTER TABLE "templates" ADD COLUMN "image_object_id" uuid;
ALTER TABLE "template_publications" ADD COLUMN "image_object_id" uuid;
ALTER TABLE "templates" ADD CONSTRAINT "templates_image_object_id_storage_objects_id_fk" FOREIGN KEY ("image_object_id") REFERENCES "public"."storage_objects"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "template_publications" ADD CONSTRAINT "template_publications_image_object_id_storage_objects_id_fk" FOREIGN KEY ("image_object_id") REFERENCES "public"."storage_objects"("id") ON DELETE restrict ON UPDATE no action;
CREATE TABLE "template_image_uploads" (
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
);
ALTER TABLE "template_image_uploads" ADD CONSTRAINT "template_image_uploads_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "template_image_uploads" ADD CONSTRAINT "template_image_uploads_object_id_storage_objects_id_fk" FOREIGN KEY ("object_id") REFERENCES "public"."storage_objects"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "template_image_uploads" ADD CONSTRAINT "template_image_uploads_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "template_image_uploads" ADD CONSTRAINT "template_image_uploads_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;

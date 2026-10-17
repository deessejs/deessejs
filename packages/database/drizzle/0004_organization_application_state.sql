CREATE TABLE "account_organization_defaults" (
	"user_id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_organization_provisioning" (
	"user_id" text PRIMARY KEY NOT NULL,
	"operation_id" text NOT NULL,
	"organization_id" text,
	"requested_name" text NOT NULL,
	"requested_slug" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"lease_until" timestamp,
	"fencing_token" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "account_organization_provisioning_operation_id_unique" UNIQUE("operation_id")
);
--> statement-breakpoint
CREATE INDEX "account_organization_defaults_org_idx" ON "account_organization_defaults" USING btree ("organization_id");
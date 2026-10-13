-- RFC-001 §5: Durable first-organization provisioning record.
-- One row per account. Carries the bootstrap marker correlated with
-- the plugin's organization row, the requested name and final
-- slug for retry consistency, and the lease + fencing token used
-- by the recovery protocol.
CREATE TABLE "account_organization_provisioning" (
	"user_id" text PRIMARY KEY NOT NULL,
	"operation_id" text NOT NULL,
	"organization_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_name" text NOT NULL,
	"final_slug" text NOT NULL,
	"lease_until" bigint NOT NULL,
	"fencing_token" bigint DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- RFC-001 §5: Permanent default organization invariant. One row
-- per account. ON DELETE RESTRICT on organization_id so the
-- database rejects deletion of the default organization even
-- when the plugin's beforeDeleteOrganization hook is bypassed.
CREATE TABLE "account_organization_defaults" (
	"user_id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- RFC-001 §6: Plugin-generated organization table. One per
-- onboarding plus one per additional creation. Carries the
-- bootstrapOperationId additional field for correlation with
-- the provisioning record.
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text,
	"bootstrap_operation_id" text
);
--> statement-breakpoint

-- Plugin-generated unique slug index.
CREATE UNIQUE INDEX "organization_slug_uidx" ON "organization" USING btree ("slug");
--> statement-breakpoint

-- RFC-001 §5: bootstrapOperationId additional field (input: false).
-- The plugin refuses to write this column from caller input; the
-- beforeCreateOrganization hook is the only writer. Partial unique
-- index allows existing organizations to have NULL while new
-- bootstrap rows have a unique marker.
CREATE UNIQUE INDEX "organization_bootstrapOperationId_uidx" ON "organization" USING btree ("bootstrap_operation_id") WHERE "bootstrap_operation_id" IS NOT NULL;
--> statement-breakpoint

-- RFC-001 §7: Plugin-generated member table. Pair (organizationId,
-- userId) is unique by construction in the plugin's invitation
-- acceptance path; we add the index to make the lookup
-- O(log n) for the requireOrganizationAccess helper.
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint

CREATE INDEX "member_organizationId_idx" ON "member" USING btree ("organization_id");
--> statement-breakpoint

CREATE INDEX "member_userId_idx" ON "member" USING btree ("user_id");
--> statement-breakpoint

-- RFC-001 §9: Plugin-generated invitation table. The plugin
-- enforces email uniqueness per organization; the index supports
-- the lookup in the invitation helper.
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint

CREATE INDEX "invitation_organizationId_idx" ON "invitation" USING btree ("organization_id");
--> statement-breakpoint

CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");
--> statement-breakpoint

-- Foreign keys. The plugin's cascade rules are preserved.
ALTER TABLE "account_organization_provisioning" ADD CONSTRAINT "account_organization_provisioning_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_organization_provisioning" ADD CONSTRAINT "account_organization_provisioning_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_organization_defaults" ADD CONSTRAINT "account_organization_defaults_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_organization_defaults" ADD CONSTRAINT "account_organization_defaults_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Application-state indexes. Unique on
-- account_organization_defaults.organizationId is enforced because
-- a single organization is the default of exactly one account
-- (the creator). Without the unique index the database would
-- accept two accounts sharing the same default — the application
-- invariant forbids that, but the database enforces it too.
CREATE UNIQUE INDEX "account_org_defaults_org_uidx" ON "account_organization_defaults" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_org_provisioning_op_uidx" ON "account_organization_provisioning" USING btree ("operation_id");--> statement-breakpoint
CREATE INDEX "account_org_provisioning_status_idx" ON "account_organization_provisioning" USING btree ("status");--> statement-breakpoint
CREATE INDEX "account_org_provisioning_lease_idx" ON "account_organization_provisioning" USING btree ("lease_until");

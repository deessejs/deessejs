-- RFC-001 §5: Durable first-organization provisioning record.
-- One row per account. Carries the bootstrap marker correlated with
-- the plugin's organization row, the requested name and final
-- slug for retry consistency, and the lease + fencing token used
-- by the recovery protocol.
--
-- The migration 0000 created the original session table without
-- active_organization_id. The organization plugin's session shape
-- carries an active org id; add the column on this same migration
-- to keep the schema consistent.
ALTER TABLE "session" ADD COLUMN "active_organization_id" text;--> statement-breakpoint

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
-- beforeCreateOrganization hook is the only writer.
--
-- The marker is a correlation pointer between the plugin's
-- organization row and the `account_organization_provisioning`
-- row that owns it. For the FIRST (default) organization, every
-- account has exactly one provisioning row, and the marker is
-- unique to that account: a partial UNIQUE index on
-- `bootstrap_operation_id WHERE NOT NULL` makes a second
-- organization row with the same marker a hard constraint
-- violation. Two parallel onboarding attempts that share the
-- same marker (because `prepareOrganizationCreation` re-reads
-- the existing row) would otherwise both succeed and leave the
-- system with two orgs that look like the same "bootstrap".
--
-- For ADDITIONAL organizations the column is set to NULL — the
-- marker is a one-shot pointer for the default org only. A
-- partial index on `NOT NULL` allows many NULLs, so the
-- additional-org path is not blocked.
--
-- The primary key on `account_organization_provisioning.user_id`
-- remains the per-user constraint; this index is the per-marker
-- constraint.
CREATE UNIQUE INDEX "organization_bootstrapOperationId_uidx"
	ON "organization" ("bootstrap_operation_id")
	WHERE "bootstrap_operation_id" IS NOT NULL;
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
CREATE INDEX "account_org_provisioning_lease_idx" ON "account_organization_provisioning" USING btree ("lease_until");--> statement-breakpoint

-- RFC-001 §5 + §7: a single (organization, user) pair can have at
-- most one membership row. The plugin enforces this through the
-- invitation lifecycle; the database enforces it as a last-line
-- defense. Without this index, two parallel invitation acceptances
-- for the same user could race and create duplicate memberships.
CREATE UNIQUE INDEX "member_organizationId_userId_uidx" ON "member" USING btree ("organization_id", "user_id");

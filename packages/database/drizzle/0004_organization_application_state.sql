-- Organizations V1 application-owned state: the permanent default relation
-- and the durable provisioning record. Declarations only — no FKs to the
-- Better Auth plugin tables, no relations. The composite FK from
-- `account_organization_defaults` to the unique `(organizationId, userId)`
-- member pair, and the FKs to `user.id` and `organization.id`, land in
-- PR-3 alongside the last-owner trigger design.
-- See `docs/specs/organizations-v1-pr1.md` §3.6 and §3.7.

CREATE TABLE IF NOT EXISTS "account_organization_defaults" (
  "user_id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "account_organization_defaults_org_idx"
  ON "account_organization_defaults" USING btree ("organization_id");

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "account_organization_provisioning" (
  "user_id" text PRIMARY KEY NOT NULL,
  "operation_id" text NOT NULL,
  "organization_id" text,
  "requested_name" text NOT NULL,
  "requested_slug" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "lease_until" timestamp,
  "fencing_token" bigint DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "account_organization_provisioning_operation_id_unique"
  ON "account_organization_provisioning" USING btree ("operation_id");

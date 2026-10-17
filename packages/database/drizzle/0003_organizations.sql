-- Better Auth organization plugin: tables, additional field, session column.
-- See `docs/specs/organizations-v1-pr1.md` §3.7 for the generation context.
-- This file is committed by hand for PR-1; on the next dev-environment
-- refresh, run `pnpm --filter @workspace/database db:generate` to confirm
-- the diff is empty (or to refresh the meta snapshot if the CLI's output
-- differs in whitespace).

CREATE TABLE IF NOT EXISTS "organization" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "logo" text,
  "created_at" timestamp NOT NULL,
  "metadata" text,
  "bootstrap_operation_id" text
);

--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "organization_slug_unique"
  ON "organization" USING btree ("slug");

--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "organization_bootstrap_operation_id_unique"
  ON "organization" USING btree ("bootstrap_operation_id");

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "member" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "user_id" text NOT NULL,
  "role" text NOT NULL,
  "created_at" timestamp NOT NULL
);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "member_organization_id_user_id_idx"
  ON "member" USING btree ("organization_id","user_id");

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "invitation" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "email" text NOT NULL,
  "role" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "expires_at" timestamp NOT NULL,
  "inviter_id" text NOT NULL
);

--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "member"
    ADD CONSTRAINT "member_organization_id_organization_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "member"
    ADD CONSTRAINT "member_user_id_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "invitation"
    ADD CONSTRAINT "invitation_organization_id_organization_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "invitation"
    ADD CONSTRAINT "invitation_inviter_id_user_id_fk"
    FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

--> statement-breakpoint

ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "active_organization_id" text;

--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "session"
    ADD CONSTRAINT "session_active_organization_id_organization_id_fk"
    FOREIGN KEY ("active_organization_id") REFERENCES "public"."organization"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "session_active_organization_id_idx"
  ON "session" USING btree ("active_organization_id");

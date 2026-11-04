CREATE TABLE "organization_subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"plan" text NOT NULL,
	"status" text NOT NULL,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_subscription_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "organization_subscription" ADD CONSTRAINT "organization_subscription_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "organization_subscription_org_idx" ON "organization_subscription" USING btree ("organization_id");
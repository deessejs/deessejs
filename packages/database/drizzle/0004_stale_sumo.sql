CREATE TABLE "github_app_installation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"installation_id" text NOT NULL,
	"account_id" text NOT NULL,
	"account_login" text NOT NULL,
	"account_type" text NOT NULL,
	"linked_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_user_connection" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"github_user_id" text NOT NULL,
	"github_login" text NOT NULL,
	"access_token_encrypted" text NOT NULL,
	"refresh_token_encrypted" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "github_app_installation" ADD CONSTRAINT "github_app_installation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_app_installation" ADD CONSTRAINT "github_app_installation_linked_by_user_id_user_id_fk" FOREIGN KEY ("linked_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_user_connection" ADD CONSTRAINT "github_user_connection_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "github_app_installation_organization_uidx" ON "github_app_installation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "github_app_installation_installation_idx" ON "github_app_installation" USING btree ("installation_id");--> statement-breakpoint
CREATE INDEX "github_app_installation_linked_by_user_idx" ON "github_app_installation" USING btree ("linked_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "github_user_connection_user_uidx" ON "github_user_connection" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "github_user_connection_github_user_uidx" ON "github_user_connection" USING btree ("github_user_id");
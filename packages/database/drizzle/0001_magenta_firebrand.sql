CREATE TABLE "deviceCode" (
	"id" text PRIMARY KEY NOT NULL,
	"device_code" text NOT NULL,
	"user_code" text NOT NULL,
	"user_id" text,
	"client_id" text,
	"scope" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"last_polled_at" timestamp,
	"polling_interval" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "deviceCode_device_code_unique" UNIQUE("device_code"),
	CONSTRAINT "deviceCode_user_code_unique" UNIQUE("user_code")
);
--> statement-breakpoint
ALTER TABLE "deviceCode" ADD CONSTRAINT "deviceCode_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deviceCode_userId_idx" ON "deviceCode" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "deviceCode_expiresAt_idx" ON "deviceCode" USING btree ("expires_at");
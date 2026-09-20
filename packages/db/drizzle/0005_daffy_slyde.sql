CREATE TABLE "connection_invitation" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"inviter_user_id" text NOT NULL,
	"recipient_email" text NOT NULL,
	"token_hash" text NOT NULL,
	"delivery_failed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_connection" (
	"user_low_id" text NOT NULL,
	"user_high_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_connection_user_low_id_user_high_id_pk" PRIMARY KEY("user_low_id","user_high_id"),
	CONSTRAINT "user_connection_canonical_order_check" CHECK ("user_connection"."user_low_id" < "user_connection"."user_high_id")
);
--> statement-breakpoint
CREATE TABLE "user_sharing_setting" (
	"user_id" text PRIMARY KEY NOT NULL,
	"share_calories" boolean DEFAULT false NOT NULL,
	"share_weight" boolean DEFAULT false NOT NULL,
	"share_recipes" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "connection_invitation" ADD CONSTRAINT "connection_invitation_inviter_user_id_user_id_fk" FOREIGN KEY ("inviter_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_connection" ADD CONSTRAINT "user_connection_user_low_id_user_id_fk" FOREIGN KEY ("user_low_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_connection" ADD CONSTRAINT "user_connection_user_high_id_user_id_fk" FOREIGN KEY ("user_high_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sharing_setting" ADD CONSTRAINT "user_sharing_setting_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "connection_invitation_recipient_email_idx" ON "connection_invitation" USING btree ("recipient_email");--> statement-breakpoint
CREATE UNIQUE INDEX "connection_invitation_inviter_recipient_idx" ON "connection_invitation" USING btree ("inviter_user_id","recipient_email");--> statement-breakpoint
CREATE UNIQUE INDEX "connection_invitation_token_hash_idx" ON "connection_invitation" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "user_connection_user_high_id_idx" ON "user_connection" USING btree ("user_high_id");
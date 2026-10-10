CREATE TABLE "diary_key" (
	"user_id" text PRIMARY KEY NOT NULL,
	"salt" text NOT NULL,
	"iterations" integer NOT NULL,
	"wrapped_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "diary_entry" ADD COLUMN "ciphertext" text;--> statement-breakpoint
ALTER TABLE "diary_key" ADD CONSTRAINT "diary_key_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_entry" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "diary_entry" DROP COLUMN "markdown";
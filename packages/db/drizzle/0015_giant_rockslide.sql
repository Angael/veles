ALTER TABLE "diary_entry" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "note" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;
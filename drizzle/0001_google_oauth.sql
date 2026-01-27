-- Migration: Google OAuth (replace email/password with Google OAuth)
-- This migration changes the auth system from email/password to Google OAuth only

-- Add new columns for Google OAuth
ALTER TABLE "user" ADD COLUMN "google_id" varchar(255);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "name" varchar(255);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "picture" varchar(2048);--> statement-breakpoint

-- For existing users (if any), we need to handle the migration
-- Since we're switching to Google OAuth only, existing users will need to re-authenticate
-- Set a placeholder google_id for any existing users to satisfy NOT NULL constraint
UPDATE "user" SET "google_id" = "id" WHERE "google_id" IS NULL;--> statement-breakpoint

-- Now make google_id NOT NULL and add unique constraint
ALTER TABLE "user" ALTER COLUMN "google_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_google_id_unique" UNIQUE("google_id");--> statement-breakpoint

-- Drop the hashed_password column (no longer needed for Google OAuth)
ALTER TABLE "user" DROP COLUMN "hashed_password";--> statement-breakpoint

-- Add foreign key constraint from user_session to user with cascade delete
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

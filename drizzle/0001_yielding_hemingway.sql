CREATE TYPE "public"."upload_status" AS ENUM('PENDING', 'UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TABLE "file_upload" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"original_name" varchar(512) NOT NULL,
	"r2_key" varchar(1024) NOT NULL,
	"content_type" varchar(255) NOT NULL,
	"size" integer NOT NULL,
	"status" "upload_status" DEFAULT 'PENDING' NOT NULL,
	"error_message" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "file_upload_r2_key_unique" UNIQUE("r2_key")
);
--> statement-breakpoint
ALTER TABLE "file_upload" ADD CONSTRAINT "file_upload_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "file_upload_user_id_idx" ON "file_upload" USING btree ("user_id");
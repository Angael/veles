CREATE TABLE "food_photo_scan" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" text NOT NULL,
	"log_date" date NOT NULL,
	"grams_hundredths" integer,
	"barcode" text,
	"photo_upload_object_ids" text[] NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error" text,
	"food_log_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "food_photo_scan" ADD CONSTRAINT "food_photo_scan_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_photo_scan" ADD CONSTRAINT "food_photo_scan_food_log_id_food_log_id_fk" FOREIGN KEY ("food_log_id") REFERENCES "public"."food_log"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "food_photo_scan_user_id_log_date_idx" ON "food_photo_scan" USING btree ("user_id","log_date");--> statement-breakpoint
CREATE INDEX "food_photo_scan_status_idx" ON "food_photo_scan" USING btree ("status","updated_at");
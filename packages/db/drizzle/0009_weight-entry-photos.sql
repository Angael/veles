CREATE TABLE "weight_entry_photo" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"weight_entry_id" uuid NOT NULL,
	"upload_object_id" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "weight_entry_photo_position_non_negative_check" CHECK ("weight_entry_photo"."position" >= 0)
);
--> statement-breakpoint
ALTER TABLE "weight_entry_photo" ADD CONSTRAINT "weight_entry_photo_weight_entry_id_weight_entry_id_fk" FOREIGN KEY ("weight_entry_id") REFERENCES "public"."weight_entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_entry_photo" ADD CONSTRAINT "weight_entry_photo_upload_object_id_upload_object_id_fk" FOREIGN KEY ("upload_object_id") REFERENCES "public"."upload_object"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "weight_entry_photo_weight_entry_id_idx" ON "weight_entry_photo" USING btree ("weight_entry_id");--> statement-breakpoint
CREATE UNIQUE INDEX "weight_entry_photo_entry_position_idx" ON "weight_entry_photo" USING btree ("weight_entry_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "weight_entry_photo_upload_object_id_idx" ON "weight_entry_photo" USING btree ("upload_object_id");
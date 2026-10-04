CREATE TABLE "food_log_share_item" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"share_id" uuid NOT NULL,
	"food_log_id" uuid NOT NULL,
	"grams_hundredths" integer
);
--> statement-breakpoint
CREATE TABLE "food_log_share" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"sender_user_id" text NOT NULL,
	"recipient_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "food_log_share_item" ADD CONSTRAINT "food_log_share_item_share_id_food_log_share_id_fk" FOREIGN KEY ("share_id") REFERENCES "public"."food_log_share"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_log_share_item" ADD CONSTRAINT "food_log_share_item_food_log_id_food_log_id_fk" FOREIGN KEY ("food_log_id") REFERENCES "public"."food_log"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_log_share" ADD CONSTRAINT "food_log_share_sender_user_id_user_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_log_share" ADD CONSTRAINT "food_log_share_recipient_user_id_user_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "food_log_share_item_share_id_idx" ON "food_log_share_item" USING btree ("share_id");--> statement-breakpoint
CREATE INDEX "food_log_share_item_food_log_id_idx" ON "food_log_share_item" USING btree ("food_log_id");--> statement-breakpoint
CREATE INDEX "food_log_share_recipient_user_id_idx" ON "food_log_share" USING btree ("recipient_user_id");--> statement-breakpoint
CREATE INDEX "food_log_share_sender_user_id_idx" ON "food_log_share" USING btree ("sender_user_id");
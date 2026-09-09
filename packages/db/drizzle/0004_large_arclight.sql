CREATE TABLE "calorie_goal" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" text NOT NULL,
	"effective_date" date NOT NULL,
	"kcal_limit_hundredths" integer NOT NULL,
	"protein_limit_hundredths" integer,
	"fat_limit_hundredths" integer,
	"carbs_limit_hundredths" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_log" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" text NOT NULL,
	"product_id" uuid,
	"image_upload_object_id" text,
	"name" text NOT NULL,
	"grams_hundredths" integer,
	"log_date" date NOT NULL,
	"kcal_hundredths" integer NOT NULL,
	"protein_hundredths" integer,
	"fat_hundredths" integer,
	"carbs_hundredths" integer,
	"consumed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_product" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"barcode" text,
	"name" text NOT NULL,
	"image_upload_object_id" text,
	"product_size_grams_hundredths" integer,
	"kcal_per_100g_hundredths" integer NOT NULL,
	"protein_per_100g_hundredths" integer,
	"fat_per_100g_hundredths" integer,
	"carbs_per_100g_hundredths" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calorie_goal" ADD CONSTRAINT "calorie_goal_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_log" ADD CONSTRAINT "food_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_log" ADD CONSTRAINT "food_log_product_id_food_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."food_product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_log" ADD CONSTRAINT "food_log_image_upload_object_id_upload_object_id_fk" FOREIGN KEY ("image_upload_object_id") REFERENCES "public"."upload_object"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_product" ADD CONSTRAINT "food_product_image_upload_object_id_upload_object_id_fk" FOREIGN KEY ("image_upload_object_id") REFERENCES "public"."upload_object"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "calorie_goal_user_id_effective_date_idx" ON "calorie_goal" USING btree ("user_id","effective_date");--> statement-breakpoint
CREATE INDEX "food_log_user_id_log_date_idx" ON "food_log" USING btree ("user_id","log_date");--> statement-breakpoint
CREATE INDEX "food_log_product_id_idx" ON "food_log" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "food_log_image_upload_object_id_idx" ON "food_log" USING btree ("image_upload_object_id");--> statement-breakpoint
CREATE UNIQUE INDEX "food_product_barcode_idx" ON "food_product" USING btree ("barcode");--> statement-breakpoint
CREATE INDEX "food_product_name_idx" ON "food_product" USING btree ("name");--> statement-breakpoint
CREATE INDEX "food_product_image_upload_object_id_idx" ON "food_product" USING btree ("image_upload_object_id");
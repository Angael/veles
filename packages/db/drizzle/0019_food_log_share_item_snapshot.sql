ALTER TABLE "food_log_share_item" DROP CONSTRAINT "food_log_share_item_food_log_id_food_log_id_fk";
--> statement-breakpoint
DROP INDEX "food_log_share_item_food_log_id_idx";--> statement-breakpoint
ALTER TABLE "food_log_share_item" ADD COLUMN "product_id" uuid;--> statement-breakpoint
ALTER TABLE "food_log_share_item" ADD COLUMN "image_upload_object_id" text;--> statement-breakpoint
ALTER TABLE "food_log_share_item" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "food_log_share_item" ADD COLUMN "kcal_hundredths" integer;--> statement-breakpoint
ALTER TABLE "food_log_share_item" ADD COLUMN "protein_hundredths" integer;--> statement-breakpoint
ALTER TABLE "food_log_share_item" ADD COLUMN "fat_hundredths" integer;--> statement-breakpoint
ALTER TABLE "food_log_share_item" ADD COLUMN "carbs_hundredths" integer;--> statement-breakpoint
ALTER TABLE "food_log_share_item" ADD CONSTRAINT "food_log_share_item_product_id_food_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."food_product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_log_share_item" ADD CONSTRAINT "food_log_share_item_image_upload_object_id_upload_object_id_fk" FOREIGN KEY ("image_upload_object_id") REFERENCES "public"."upload_object"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "food_log_share_item_product_id_idx" ON "food_log_share_item" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "food_log_share_item_image_upload_object_id_idx" ON "food_log_share_item" USING btree ("image_upload_object_id");--> statement-breakpoint
UPDATE "food_log_share_item" AS item SET
	"product_id" = log."product_id",
	"image_upload_object_id" = log."image_upload_object_id",
	"name" = log."name",
	"grams_hundredths" = CASE WHEN item."grams_hundredths" IS NOT NULL AND log."grams_hundredths" > 0 THEN item."grams_hundredths" ELSE log."grams_hundredths" END,
	"kcal_hundredths" = CASE WHEN item."grams_hundredths" IS NOT NULL AND log."grams_hundredths" > 0 THEN round(log."kcal_hundredths"::numeric * item."grams_hundredths" / log."grams_hundredths")::integer ELSE log."kcal_hundredths" END,
	"protein_hundredths" = CASE WHEN item."grams_hundredths" IS NOT NULL AND log."grams_hundredths" > 0 THEN round(log."protein_hundredths"::numeric * item."grams_hundredths" / log."grams_hundredths")::integer ELSE log."protein_hundredths" END,
	"fat_hundredths" = CASE WHEN item."grams_hundredths" IS NOT NULL AND log."grams_hundredths" > 0 THEN round(log."fat_hundredths"::numeric * item."grams_hundredths" / log."grams_hundredths")::integer ELSE log."fat_hundredths" END,
	"carbs_hundredths" = CASE WHEN item."grams_hundredths" IS NOT NULL AND log."grams_hundredths" > 0 THEN round(log."carbs_hundredths"::numeric * item."grams_hundredths" / log."grams_hundredths")::integer ELSE log."carbs_hundredths" END
FROM "food_log" AS log
WHERE log."id" = item."food_log_id";
--> statement-breakpoint
DELETE FROM "food_log_share" AS share WHERE NOT EXISTS (SELECT 1 FROM "food_log_share_item" AS item WHERE item."share_id" = share."id");
--> statement-breakpoint
ALTER TABLE "food_log_share_item" ALTER COLUMN "name" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "food_log_share_item" ALTER COLUMN "kcal_hundredths" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "food_log_share_item" DROP COLUMN "food_log_id";
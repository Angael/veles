ALTER TABLE "food_product" ADD COLUMN "seed_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "food_product_seed_key_idx" ON "food_product" USING btree ("seed_key");
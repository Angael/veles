CREATE TABLE "recipe_ingredient" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"product_id" uuid,
	"name" text NOT NULL,
	"grams_hundredths" integer,
	CONSTRAINT "recipe_ingredient_position_non_negative_check" CHECK ("recipe_ingredient"."position" >= 0),
	CONSTRAINT "recipe_ingredient_grams_positive_check" CHECK ("recipe_ingredient"."grams_hundredths" IS NULL OR "recipe_ingredient"."grams_hundredths" > 0)
);
--> statement-breakpoint
ALTER TABLE "recipe_ingredient" ADD CONSTRAINT "recipe_ingredient_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredient" ADD CONSTRAINT "recipe_ingredient_product_id_food_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."food_product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_ingredient_recipe_position_idx" ON "recipe_ingredient" USING btree ("recipe_id","position");--> statement-breakpoint
CREATE INDEX "recipe_ingredient_product_id_idx" ON "recipe_ingredient" USING btree ("product_id");
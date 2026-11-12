CREATE TABLE "meal_plan_item" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"recipe_id" uuid,
	"name" text NOT NULL,
	"portions_hundredths" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meal_plan_item_portions_positive_check" CHECK ("meal_plan_item"."portions_hundredths" > 0)
);
--> statement-breakpoint
ALTER TABLE "meal_plan_item" ADD CONSTRAINT "meal_plan_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_plan_item" ADD CONSTRAINT "meal_plan_item_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "meal_plan_item_user_id_date_idx" ON "meal_plan_item" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "meal_plan_item_recipe_id_idx" ON "meal_plan_item" USING btree ("recipe_id");
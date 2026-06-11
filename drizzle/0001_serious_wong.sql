CREATE TABLE "recipe_image" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"upload_object_id" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_image_position_non_negative_check" CHECK ("recipe_image"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "recipe_last_view" (
	"user_id" text NOT NULL,
	"recipe_id" uuid NOT NULL,
	"viewed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_last_view_user_id_recipe_id_pk" PRIMARY KEY("user_id","recipe_id")
);
--> statement-breakpoint
CREATE TABLE "recipe" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"ingredients" text[] NOT NULL,
	"tags" text[] NOT NULL,
	"portions" integer DEFAULT 1 NOT NULL,
	"rating" integer,
	"kcal" integer,
	"protein" integer,
	"carbs" integer,
	"fats" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_portions_positive_check" CHECK ("recipe"."portions" > 0),
	CONSTRAINT "recipe_rating_range_check" CHECK ("recipe"."rating" IS NULL OR "recipe"."rating" BETWEEN 1 AND 5),
	CONSTRAINT "recipe_kcal_non_negative_check" CHECK ("recipe"."kcal" IS NULL OR "recipe"."kcal" >= 0),
	CONSTRAINT "recipe_protein_non_negative_check" CHECK ("recipe"."protein" IS NULL OR "recipe"."protein" >= 0),
	CONSTRAINT "recipe_carbs_non_negative_check" CHECK ("recipe"."carbs" IS NULL OR "recipe"."carbs" >= 0),
	CONSTRAINT "recipe_fats_non_negative_check" CHECK ("recipe"."fats" IS NULL OR "recipe"."fats" >= 0)
);
--> statement-breakpoint
ALTER TABLE "recipe_image" ADD CONSTRAINT "recipe_image_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_image" ADD CONSTRAINT "recipe_image_upload_object_id_upload_object_id_fk" FOREIGN KEY ("upload_object_id") REFERENCES "public"."upload_object"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_last_view" ADD CONSTRAINT "recipe_last_view_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_last_view" ADD CONSTRAINT "recipe_last_view_recipe_id_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipe"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe" ADD CONSTRAINT "recipe_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recipe_image_recipe_id_idx" ON "recipe_image" USING btree ("recipe_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_image_recipe_position_idx" ON "recipe_image" USING btree ("recipe_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_image_upload_object_id_idx" ON "recipe_image" USING btree ("upload_object_id");--> statement-breakpoint
CREATE INDEX "recipe_user_id_idx" ON "recipe" USING btree ("user_id");
ALTER TABLE "recipe" DROP CONSTRAINT "recipe_kcal_non_negative_check";--> statement-breakpoint
ALTER TABLE "recipe" DROP CONSTRAINT "recipe_protein_non_negative_check";--> statement-breakpoint
ALTER TABLE "recipe" DROP CONSTRAINT "recipe_carbs_non_negative_check";--> statement-breakpoint
ALTER TABLE "recipe" DROP CONSTRAINT "recipe_fats_non_negative_check";--> statement-breakpoint
ALTER TABLE "recipe" DROP COLUMN "ingredients";--> statement-breakpoint
ALTER TABLE "recipe" DROP COLUMN "tags";--> statement-breakpoint
ALTER TABLE "recipe" DROP COLUMN "kcal";--> statement-breakpoint
ALTER TABLE "recipe" DROP COLUMN "protein";--> statement-breakpoint
ALTER TABLE "recipe" DROP COLUMN "carbs";--> statement-breakpoint
ALTER TABLE "recipe" DROP COLUMN "fats";
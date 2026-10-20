CREATE TABLE "calorie_day_note" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"off_plan" boolean DEFAULT false NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calorie_day_note" ADD CONSTRAINT "calorie_day_note_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "calorie_day_note_user_id_date_idx" ON "calorie_day_note" USING btree ("user_id","date");
CREATE TABLE "workout_exercise" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"measure" text DEFAULT 'weight_reps' NOT NULL,
	"rest_seconds" integer DEFAULT 120,
	"notes" text DEFAULT '' NOT NULL,
	"archived_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workout_exercise_measure_check" CHECK ("workout_exercise"."measure" IN ('weight_reps', 'reps', 'duration', 'weight_duration', 'distance_duration'))
);
--> statement-breakpoint
CREATE TABLE "workout_routine_exercise" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"routine_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"set_types" text[] NOT NULL,
	CONSTRAINT "workout_routine_exercise_set_types_check" CHECK (cardinality("workout_routine_exercise"."set_types") >= 1 AND "workout_routine_exercise"."set_types" <@ ARRAY['normal', 'warmup', 'drop', 'failure']::text[])
);
--> statement-breakpoint
CREATE TABLE "workout_routine" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_session_exercise" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"session_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"notes" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_session" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"routine_id" uuid,
	"date" date NOT NULL,
	"started_at" timestamp,
	"ended_at" timestamp,
	"duration_seconds" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_set" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"session_exercise_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"type" text DEFAULT 'normal' NOT NULL,
	"weight_grams" integer,
	"reps" integer,
	"duration_seconds" integer,
	"distance_meters" integer,
	"completed_at" timestamp,
	CONSTRAINT "workout_set_type_check" CHECK ("workout_set"."type" IN ('normal', 'warmup', 'drop', 'failure')),
	CONSTRAINT "workout_set_non_negative_check" CHECK (coalesce("workout_set"."weight_grams", 0) >= 0 AND coalesce("workout_set"."reps", 0) >= 0 AND coalesce("workout_set"."duration_seconds", 0) >= 0 AND coalesce("workout_set"."distance_meters", 0) >= 0)
);
--> statement-breakpoint
ALTER TABLE "workout_exercise" ADD CONSTRAINT "workout_exercise_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_routine_exercise" ADD CONSTRAINT "workout_routine_exercise_routine_id_workout_routine_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."workout_routine"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_routine_exercise" ADD CONSTRAINT "workout_routine_exercise_exercise_id_workout_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."workout_exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_routine" ADD CONSTRAINT "workout_routine_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_session_exercise" ADD CONSTRAINT "workout_session_exercise_session_id_workout_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_session_exercise" ADD CONSTRAINT "workout_session_exercise_exercise_id_workout_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."workout_exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_session" ADD CONSTRAINT "workout_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_session" ADD CONSTRAINT "workout_session_routine_id_workout_routine_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."workout_routine"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_set" ADD CONSTRAINT "workout_set_session_exercise_id_workout_session_exercise_id_fk" FOREIGN KEY ("session_exercise_id") REFERENCES "public"."workout_session_exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "workout_exercise_user_id_name_idx" ON "workout_exercise" USING btree ("user_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "workout_routine_exercise_routine_position_idx" ON "workout_routine_exercise" USING btree ("routine_id","position");--> statement-breakpoint
CREATE INDEX "workout_routine_exercise_exercise_id_idx" ON "workout_routine_exercise" USING btree ("exercise_id");--> statement-breakpoint
CREATE INDEX "workout_routine_user_id_idx" ON "workout_routine" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workout_session_exercise_session_position_idx" ON "workout_session_exercise" USING btree ("session_id","position");--> statement-breakpoint
CREATE INDEX "workout_session_exercise_exercise_id_idx" ON "workout_session_exercise" USING btree ("exercise_id");--> statement-breakpoint
CREATE INDEX "workout_session_user_id_date_idx" ON "workout_session" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "workout_session_routine_id_idx" ON "workout_session" USING btree ("routine_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workout_session_one_open_idx" ON "workout_session" USING btree ("user_id") WHERE "workout_session"."ended_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "workout_set_session_exercise_position_idx" ON "workout_set" USING btree ("session_exercise_id","position");
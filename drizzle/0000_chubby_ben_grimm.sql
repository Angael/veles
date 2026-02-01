CREATE TYPE "public"."item_type" AS ENUM('IMAGE', 'VIDEO');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('SOURCE', 'COMPRESSED');--> statement-breakpoint
CREATE TYPE "public"."processing_status" AS ENUM('NO', 'STARTED', 'FAIL', 'V1');--> statement-breakpoint
CREATE TYPE "public"."stripe_plan" AS ENUM('VIP', 'ACCESS_PLAN');--> statement-breakpoint
CREATE TYPE "public"."thumbnail_type" AS ENUM('XS', 'SM', 'MD');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('FREE', 'PREMIUM', 'ADMIN');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_goal" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"kcal" real,
	"fat_g" real,
	"carb_g" real,
	"proteins_g" real,
	"date" date NOT NULL,
	"weight_kg" real
);
--> statement-breakpoint
CREATE TABLE "food_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"barcode" varchar(255),
	"user_id" varchar(255),
	"food_product_id" integer,
	"product_name" varchar(255) NOT NULL,
	"brands" varchar(255),
	"amount" real NOT NULL,
	"kcal" real NOT NULL,
	"kcal_100g" real NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_product" (
	"id" serial PRIMARY KEY NOT NULL,
	"barcode" varchar(255),
	"user_id" varchar(255),
	"product_name" varchar(255) NOT NULL,
	"brands" varchar(255),
	"image_url" varchar(2048),
	"product_quantity" real,
	"product_quantity_unit" varchar(16),
	"kcal_100g" real NOT NULL,
	"fat_100g" real,
	"carb_100g" real,
	"proteins_100g" real,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "image" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"path" varchar(256) NOT NULL,
	"size" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"media_type" "media_type" NOT NULL,
	"created_at" timestamp (3) DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "item" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"private" boolean DEFAULT false NOT NULL,
	"type" "item_type" NOT NULL,
	"processed" "processing_status" DEFAULT 'NO' NOT NULL,
	"optimized" "processing_status" DEFAULT 'NO' NOT NULL,
	"created_at" timestamp (3) DEFAULT now(),
	"updated_at" timestamp (3) DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "stripe_customer" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subscription_id" text,
	"stripe_customer_id" text NOT NULL,
	"active_plan" "stripe_plan",
	"plan_expiration" timestamp,
	CONSTRAINT "stripe_customer_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "stripe_customer_subscription_id_unique" UNIQUE("subscription_id"),
	CONSTRAINT "stripe_customer_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "thumbnail" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"type" "thumbnail_type" NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"path" varchar(256) NOT NULL,
	"size" integer NOT NULL,
	"created_at" timestamp (3) DEFAULT now(),
	CONSTRAINT "thumbnail_item_id_type_unique" UNIQUE("item_id","type")
);
--> statement-breakpoint
CREATE TABLE "user_weight" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"weight_kg" real NOT NULL,
	"date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"path" varchar(256) NOT NULL,
	"size" integer NOT NULL,
	"width" smallint NOT NULL,
	"height" smallint NOT NULL,
	"bitrate_kb" integer NOT NULL,
	"duration_ms" integer NOT NULL,
	"media_type" "media_type" NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_log" ADD CONSTRAINT "food_log_food_product_id_food_product_id_fk" FOREIGN KEY ("food_product_id") REFERENCES "public"."food_product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image" ADD CONSTRAINT "image_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_customer" ADD CONSTRAINT "stripe_customer_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thumbnail" ADD CONSTRAINT "thumbnail_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_weight" ADD CONSTRAINT "user_weight_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video" ADD CONSTRAINT "video_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_barcode_user_id" ON "food_product" USING btree ("barcode","user_id");--> statement-breakpoint
CREATE INDEX "image_item_id_fkey" ON "image" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "item_user_id_fkey" ON "item" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "video_item_id_fkey" ON "video" USING btree ("item_id");
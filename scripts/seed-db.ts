/**
 * Seed the local database with sample data
 *
 * Usage:
 *   pnpm db:seed
 *
 * Requires DATABASE_URL in .env or .env.local
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../src/db/schema.ts";
import { logger as baseLogger } from "../src/lib/logger.ts";

const logger = baseLogger.child({}, { msgPrefix: "[seed-db] " });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	logger.error("DATABASE_URL is required. Set it in .env or .env.local");
	process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool, { schema });

// ============================================================================
// SEED DATA
// ============================================================================

const TEST_USER = {
	id: "seed-user-001",
	name: "Test User",
	email: "test@example.com",
	emailVerified: true,
};

const FOOD_PRODUCTS = [
	{
		barcode: "5901234123457",
		productName: "Oatmeal",
		brands: "Quaker",
		kcal100g: 367,
		fat100g: 7,
		carb100g: 58,
		proteins100g: 14,
	},
	{
		barcode: "4006381333931",
		productName: "Greek Yogurt",
		brands: "Fage",
		kcal100g: 97,
		fat100g: 5,
		carb100g: 3,
		proteins100g: 9,
	},
	{
		barcode: "7622210449283",
		productName: "Dark Chocolate",
		brands: "Lindt",
		kcal100g: 545,
		fat100g: 32,
		carb100g: 50,
		proteins100g: 6,
	},
];

const ITEMS = [
	{ type: "IMAGE" as const, private: false },
	{ type: "IMAGE" as const, private: false },
	{ type: "IMAGE" as const, private: true },
	{ type: "VIDEO" as const, private: false },
	{ type: "VIDEO" as const, private: false },
	{ type: "VIDEO" as const, private: true },
];

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function seedUser() {
	logger.debug("Seeding user");
	await db.insert(schema.users).values(TEST_USER).onConflictDoNothing();
	logger.debug({ email: TEST_USER.email }, "User created");
}

async function seedFoodProducts() {
	logger.debug("Seeding food products");
	for (const product of FOOD_PRODUCTS) {
		await db.insert(schema.foodProducts).values(product).onConflictDoNothing();
		logger.debug({ product: product.productName }, "Food product created");
	}
}

async function seedItems() {
	logger.debug("Seeding items");

	for (let i = 0; i < ITEMS.length; i++) {
		const itemData = ITEMS[i];

		const [item] = await db
			.insert(schema.items)
			.values({
				userId: TEST_USER.id,
				type: itemData.type,
				private: itemData.private,
				processed: "V1",
				optimized: "V1",
			})
			.returning();

		if (itemData.type === "IMAGE") {
			await db.insert(schema.images).values({
				itemId: item.id,
				path: `seed/image-${i + 1}.jpg`,
				size: 102400 + i * 10000,
				width: 1920,
				height: 1080,
				mediaType: "SOURCE",
			});
			logger.debug(
				{ itemId: item.id, type: "image", private: itemData.private },
				"Image item created",
			);
		} else {
			await db.insert(schema.videos).values({
				itemId: item.id,
				path: `seed/video-${i + 1}.mp4`,
				size: 5242880 + i * 100000,
				width: 1920,
				height: 1080,
				bitrateKb: 8000,
				durationMs: 30000 + i * 5000,
				mediaType: "SOURCE",
			});
			logger.debug(
				{ itemId: item.id, type: "video", private: itemData.private },
				"Video item created",
			);
		}
	}
}

async function seedFoodGoal() {
	logger.debug("Seeding food goal");
	const today = new Date().toISOString().split("T")[0];

	await db.insert(schema.foodGoals).values({
		userId: TEST_USER.id,
		kcal: 2000,
		fatG: 65,
		carbG: 250,
		proteinsG: 150,
		date: today,
		weightKg: 75,
	});
	logger.debug({ date: today }, "Food goal created");
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
	logger.info("Starting");

	try {
		await seedUser();
		await seedFoodProducts();
		await seedItems();
		await seedFoodGoal();

		logger.info("Completed successfully");
	} catch (error) {
		logger.error({ err: error }, "Failed");
		process.exit(1);
	} finally {
		await pool.end();
	}
}

main();

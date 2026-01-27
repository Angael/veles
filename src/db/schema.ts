import {
	boolean,
	date,
	index,
	integer,
	pgEnum,
	pgTable,
	real,
	serial,
	smallint,
	timestamp,
	unique,
	varchar,
} from 'drizzle-orm/pg-core';

// ============================================================================
// ENUM TYPES
// ============================================================================

export const userTypeEnum = pgEnum('user_type', ['FREE', 'PREMIUM', 'ADMIN']);

export const itemTypeEnum = pgEnum('item_type', ['IMAGE', 'VIDEO']);

export const processingStatusEnum = pgEnum('processing_status', [
	'NO',
	'STARTED',
	'FAIL',
	'V1',
]);

export const mediaTypeEnum = pgEnum('media_type', ['SOURCE', 'COMPRESSED']);

export const thumbnailTypeEnum = pgEnum('thumbnail_type', ['XS', 'SM', 'MD']);

export const stripePlanEnum = pgEnum('stripe_plan', ['VIP', 'ACCESS_PLAN']);

// ============================================================================
// AUTH TABLES
// ============================================================================

export const users = pgTable('user', {
	id: varchar({ length: 64 }).primaryKey(),
	googleId: varchar('google_id', { length: 255 }).notNull().unique(),
	email: varchar({ length: 254 }).notNull().unique(),
	name: varchar({ length: 255 }),
	picture: varchar({ length: 2048 }),
	type: userTypeEnum().notNull(),
	lastLoginAt: timestamp('last_login_at', { precision: 3, mode: 'date' }),
	createdAt: timestamp('created_at', {
		precision: 3,
		mode: 'date',
	}).defaultNow(),
	updatedAt: timestamp('updated_at', {
		precision: 3,
		mode: 'date',
	}).defaultNow(),
});

export const userSessions = pgTable('user_session', {
	id: varchar({ length: 64 }).primaryKey(),
	userId: varchar('user_id', { length: 64 })
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { precision: 3, mode: 'date' }).notNull(),
});

// ============================================================================
// STRIPE / PAYMENTS
// ============================================================================

export const stripeCustomers = pgTable('stripe_customer', {
	id: varchar({ length: 64 }).primaryKey(),
	userId: varchar('user_id', { length: 64 })
		.notNull()
		.unique()
		.references(() => users.id, { onUpdate: 'cascade' }),
	subscriptionId: varchar('subscription_id', { length: 64 }).unique(),
	stripeCustomerId: varchar('stripe_customer_id', { length: 64 })
		.notNull()
		.unique(),
	activePlan: stripePlanEnum('active_plan'),
	planExpiration: timestamp('plan_expiration', { mode: 'date' }),
});

// ============================================================================
// FOOD TRACKING
// ============================================================================

export const foodProducts = pgTable(
	'food_product',
	{
		id: serial().primaryKey(),
		barcode: varchar({ length: 255 }),
		userId: varchar('user_id', { length: 255 }),
		productName: varchar('product_name', { length: 255 }).notNull(),
		brands: varchar({ length: 255 }),
		imageUrl: varchar('image_url', { length: 2048 }),
		productQuantity: real('product_quantity'),
		productQuantityUnit: varchar('product_quantity_unit', { length: 16 }),
		kcal100g: real('kcal_100g').notNull(),
		fat100g: real('fat_100g'),
		carb100g: real('carb_100g'),
		proteins100g: real('proteins_100g'),
		createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
		updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
	},
	(table) => [index('idx_barcode_user_id').on(table.barcode, table.userId)],
);

export const foodGoals = pgTable('food_goal', {
	id: serial().primaryKey(),
	userId: varchar('user_id', { length: 255 }).notNull(),
	kcal: real(),
	fatG: real('fat_g'),
	carbG: real('carb_g'),
	proteinsG: real('proteins_g'),
	date: date().notNull(),
	weightKg: real('weight_kg'),
});

export const foodLogs = pgTable('food_log', {
	id: serial().primaryKey(),
	barcode: varchar({ length: 255 }),
	userId: varchar('user_id', { length: 255 }),
	foodProductId: integer('food_product_id').references(() => foodProducts.id),
	productName: varchar('product_name', { length: 255 }).notNull(),
	brands: varchar({ length: 255 }),
	amount: real().notNull(),
	kcal: real().notNull(),
	kcal100g: real('kcal_100g').notNull(),
	date: timestamp({ mode: 'date' }).notNull().defaultNow(),
});

export const userWeights = pgTable('user_weight', {
	id: serial().primaryKey(),
	userId: varchar('user_id', { length: 64 })
		.notNull()
		.references(() => users.id),
	weightKg: real('weight_kg').notNull(),
	date: date().notNull(),
});

// ============================================================================
// MEDIA ITEMS
// ============================================================================

export const items = pgTable(
	'item',
	{
		id: serial().primaryKey(),
		userId: varchar('user_id', { length: 64 })
			.notNull()
			.references(() => users.id, { onUpdate: 'cascade' }),
		private: boolean().notNull().default(false),
		type: itemTypeEnum().notNull(),
		processed: processingStatusEnum().notNull().default('NO'),
		optimized: processingStatusEnum().notNull().default('NO'),
		createdAt: timestamp('created_at', {
			precision: 3,
			mode: 'date',
		}).defaultNow(),
		updatedAt: timestamp('updated_at', {
			precision: 3,
			mode: 'date',
		}).defaultNow(),
	},
	(table) => [index('item_user_id_fkey').on(table.userId)],
);

export const images = pgTable(
	'image',
	{
		id: serial().primaryKey(),
		itemId: integer('item_id')
			.notNull()
			.references(() => items.id, { onUpdate: 'cascade' }),
		path: varchar({ length: 256 }).notNull(),
		size: integer().notNull(),
		width: integer().notNull(),
		height: integer().notNull(),
		mediaType: mediaTypeEnum('media_type').notNull(),
		createdAt: timestamp('created_at', {
			precision: 3,
			mode: 'date',
		}).defaultNow(),
	},
	(table) => [index('image_item_id_fkey').on(table.itemId)],
);

export const videos = pgTable(
	'video',
	{
		id: serial().primaryKey(),
		itemId: integer('item_id')
			.notNull()
			.references(() => items.id, { onUpdate: 'cascade' }),
		path: varchar({ length: 256 }).notNull(),
		size: integer().notNull(),
		width: smallint().notNull(),
		height: smallint().notNull(),
		bitrateKb: integer('bitrate_kb').notNull(),
		durationMs: integer('duration_ms').notNull(),
		mediaType: mediaTypeEnum('media_type').notNull(),
		createdAt: timestamp('created_at', { precision: 3, mode: 'date' })
			.notNull()
			.defaultNow(),
	},
	(table) => [index('video_item_id_fkey').on(table.itemId)],
);

export const thumbnails = pgTable(
	'thumbnail',
	{
		id: serial().primaryKey(),
		itemId: integer('item_id')
			.notNull()
			.references(() => items.id, { onUpdate: 'cascade' }),
		type: thumbnailTypeEnum().notNull(),
		width: integer().notNull(),
		height: integer().notNull(),
		path: varchar({ length: 256 }).notNull(),
		size: integer().notNull(),
		createdAt: timestamp('created_at', {
			precision: 3,
			mode: 'date',
		}).defaultNow(),
	},
	(table) => [
		unique('thumbnail_item_id_type_unique').on(table.itemId, table.type),
	],
);

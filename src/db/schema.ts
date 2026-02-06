import { relations } from 'drizzle-orm';
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
	text,
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

export const uploadStatusEnum = pgEnum('upload_status', [
	'PENDING',
	'UPLOADED',
	'PROCESSING',
	'COMPLETED',
	'FAILED',
]);

// ============================================================================
// AUTH TABLES (Better Auth)
// ============================================================================

export const users = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull().default(false),
	image: text('image'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const sessions = pgTable(
	'session',
	{
		id: text('id').primaryKey(),
		expiresAt: timestamp('expires_at').notNull(),
		token: text('token').notNull().unique(),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
	},
	(table) => [index('session_user_id_idx').on(table.userId)],
);

export const accounts = pgTable(
	'account',
	{
		id: text('id').primaryKey(),
		accountId: text('account_id').notNull(),
		providerId: text('provider_id').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		accessToken: text('access_token'),
		refreshToken: text('refresh_token'),
		idToken: text('id_token'),
		accessTokenExpiresAt: timestamp('access_token_expires_at'),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
		scope: text('scope'),
		password: text('password'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	(table) => [index('account_user_id_idx').on(table.userId)],
);

export const verifications = pgTable(
	'verification',
	{
		id: text('id').primaryKey(),
		identifier: text('identifier').notNull(),
		value: text('value').notNull(),
		expiresAt: timestamp('expires_at').notNull(),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at').notNull().defaultNow(),
	},
	(table) => [index('verification_identifier_idx').on(table.identifier)],
);

// Auth Relations
export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id],
	}),
}));

// ============================================================================
// STRIPE / PAYMENTS
// ============================================================================

export const stripeCustomers = pgTable('stripe_customer', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => users.id, { onDelete: 'cascade' }),
	subscriptionId: text('subscription_id').unique(),
	stripeCustomerId: text('stripe_customer_id').notNull().unique(),
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
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
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
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
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

// ============================================================================
// FILE UPLOADS
// ============================================================================

export const fileUploads = pgTable(
	'file_upload',
	{
		id: serial().primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		/** Original filename from the user */
		originalName: varchar('original_name', { length: 512 }).notNull(),
		/** R2 object key */
		r2Key: varchar('r2_key', { length: 1024 }).notNull().unique(),
		/** MIME type of the file */
		contentType: varchar('content_type', { length: 255 }).notNull(),
		/** File size in bytes */
		size: integer().notNull(),
		/** Processing status for backend pipeline */
		status: uploadStatusEnum().notNull().default('PENDING'),
		/** Optional error message if processing failed */
		errorMessage: text('error_message'),
		createdAt: timestamp('created_at', { precision: 3, mode: 'date' })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' })
			.notNull()
			.defaultNow(),
	},
	(table) => [index('file_upload_user_id_idx').on(table.userId)],
);

export const fileUploadsRelations = relations(fileUploads, ({ one }) => ({
	user: one(users, {
		fields: [fileUploads.userId],
		references: [users.id],
	}),
}));

import { sql } from 'drizzle-orm';
import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './auth.schema.ts';
import { uploadObjects } from './uploads.schema.ts';

/** Global catalog entries. Nutrition values are stored in hundredths. */
export const foodProducts = pgTable(
  'food_product',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    barcode: text('barcode'),
    name: text('name').notNull(),
    /** Optional Polish search alias populated by seeds; product create/edit flows must not write it. */
    namePl: text('name_pl'),
    imageUploadObjectId: text('image_upload_object_id').references(() => uploadObjects.id, {
      onDelete: 'restrict',
    }),
    productSizeGramsHundredths: integer('product_size_grams_hundredths'),
    kcalPer100gHundredths: integer('kcal_per_100g_hundredths').notNull(),
    proteinPer100gHundredths: integer('protein_per_100g_hundredths'),
    fatPer100gHundredths: integer('fat_per_100g_hundredths'),
    carbsPer100gHundredths: integer('carbs_per_100g_hundredths'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('food_product_barcode_idx').on(table.barcode),
    index('food_product_name_idx').on(table.name),
    index('food_product_image_upload_object_id_idx').on(table.imageUploadObjectId),
  ],
);

/** User-owned nutrition snapshots; product edits refresh all users' matching logs dated today. */
export const foodLogs = pgTable(
  'food_log',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').references(() => foodProducts.id, { onDelete: 'set null' }),
    imageUploadObjectId: text('image_upload_object_id').references(() => uploadObjects.id, {
      onDelete: 'restrict',
    }),
    name: text('name').notNull(),
    gramsHundredths: integer('grams_hundredths'),
    logDate: date('log_date', { mode: 'string' }).notNull(),
    kcalHundredths: integer('kcal_hundredths').notNull(),
    proteinHundredths: integer('protein_hundredths'),
    fatHundredths: integer('fat_hundredths'),
    carbsHundredths: integer('carbs_hundredths'),
    consumedAt: timestamp('consumed_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('food_log_user_id_log_date_idx').on(table.userId, table.logDate),
    index('food_log_product_id_idx').on(table.productId),
    index('food_log_image_upload_object_id_idx').on(table.imageUploadObjectId),
  ],
);

/** Pending batch of food logs one user sent to a connected user; removed once accepted or declined. */
export const foodLogShares = pgTable(
  'food_log_share',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    senderUserId: text('sender_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recipientUserId: text('recipient_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('food_log_share_recipient_user_id_idx').on(table.recipientUserId),
    index('food_log_share_sender_user_id_idx').on(table.senderUserId),
  ],
);

/** Sender's logs offered in a share; values are read and rescaled from the log when listed or accepted. */
export const foodLogShareItems = pgTable(
  'food_log_share_item',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    shareId: uuid('share_id')
      .notNull()
      .references(() => foodLogShares.id, { onDelete: 'cascade' }),
    foodLogId: uuid('food_log_id')
      .notNull()
      .references(() => foodLogs.id, { onDelete: 'cascade' }),
    /** Amount chosen in the share dialog; null copies the log as is (custom entries without grams). */
    gramsHundredths: integer('grams_hundredths'),
  },
  (table) => [
    index('food_log_share_item_share_id_idx').on(table.shareId),
    index('food_log_share_item_food_log_id_idx').on(table.foodLogId),
  ],
);

export const calorieGoals = pgTable(
  'calorie_goal',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    effectiveDate: date('effective_date', { mode: 'string' }).notNull(),
    kcalLimitHundredths: integer('kcal_limit_hundredths').notNull(),
    proteinLimitHundredths: integer('protein_limit_hundredths'),
    fatLimitHundredths: integer('fat_limit_hundredths'),
    carbsLimitHundredths: integer('carbs_limit_hundredths'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('calorie_goal_user_id_effective_date_idx').on(table.userId, table.effectiveDate),
  ],
);

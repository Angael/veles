import { sql } from 'drizzle-orm';
import {
  check,
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

export const foodProductSources = ['veles', 'open_food_facts'] as const;

export type FoodProductSource = (typeof foodProductSources)[number];

/** Global catalog entries. Nutrition values are stored in hundredths. */
export const foodProducts = pgTable(
  'food_product',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    barcode: text('barcode'),
    name: text('name').notNull(),
    brand: text('brand'),
    imageUrl: text('image_url'),
    productSizeGramsHundredths: integer('product_size_grams_hundredths'),
    kcalPer100gHundredths: integer('kcal_per_100g_hundredths').notNull(),
    proteinPer100gHundredths: integer('protein_per_100g_hundredths'),
    carbsPer100gHundredths: integer('carbs_per_100g_hundredths'),
    fatPer100gHundredths: integer('fat_per_100g_hundredths'),
    source: text('source').notNull().default('veles'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('food_product_barcode_idx').on(table.barcode),
    index('food_product_name_idx').on(table.name),
    check(
      'food_product_size_positive_check',
      sql`${table.productSizeGramsHundredths} IS NULL OR ${table.productSizeGramsHundredths} > 0`,
    ),
    check('food_product_source_check', sql`${table.source} IN ('veles', 'open_food_facts')`),
  ],
);

/** Immutable user-owned nutrition snapshots; catalog edits never rewrite these rows. */
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
    kind: text('kind').notNull(),
    name: text('name').notNull(),
    gramsHundredths: integer('grams_hundredths'),
    logDate: date('log_date', { mode: 'string' }).notNull(),
    kcalHundredths: integer('kcal_hundredths').notNull(),
    proteinHundredths: integer('protein_hundredths'),
    carbsHundredths: integer('carbs_hundredths'),
    fatHundredths: integer('fat_hundredths'),
    consumedAt: timestamp('consumed_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('food_log_user_id_log_date_idx').on(table.userId, table.logDate),
    index('food_log_product_id_idx').on(table.productId),
    check('food_log_kind_check', sql`${table.kind} IN ('product', 'custom')`),
    check(
      'food_log_product_kind_check',
      sql`${table.kind} = 'custom' OR ${table.productId} IS NOT NULL`,
    ),
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
    carbsLimitHundredths: integer('carbs_limit_hundredths'),
    fatLimitHundredths: integer('fat_limit_hundredths'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('calorie_goal_user_id_effective_date_idx').on(table.userId, table.effectiveDate),
  ],
);

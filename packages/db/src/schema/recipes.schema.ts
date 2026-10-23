import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './auth.schema.ts';
import { foodProducts } from './calories.schema.ts';
import { uploadObjects } from './uploads.schema.ts';

export const recipes = pgTable(
  'recipe',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').notNull(),
    tags: text('tags').array().notNull(),
    portions: integer('portions').notNull().default(1),
    rating: integer('rating'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('recipe_user_id_idx').on(table.userId),
    check('recipe_portions_positive_check', sql`${table.portions} > 0`),
    check(
      'recipe_rating_range_check',
      sql`${table.rating} IS NULL OR ${table.rating} BETWEEN 1 AND 5`,
    ),
  ],
);

/**
 * Ordered recipe ingredients for the whole recipe (all portions). A linked ingredient reads its
 * nutrition from the product; `name` is a snapshot kept when the product is deleted. A custom
 * ingredient (no product) has no nutrition and is never written to the food log.
 */
export const recipeIngredients = pgTable(
  'recipe_ingredient',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    productId: uuid('product_id').references(() => foodProducts.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    gramsHundredths: integer('grams_hundredths'),
  },
  (table) => [
    uniqueIndex('recipe_ingredient_recipe_position_idx').on(table.recipeId, table.position),
    index('recipe_ingredient_product_id_idx').on(table.productId),
    check('recipe_ingredient_position_non_negative_check', sql`${table.position} >= 0`),
    check(
      'recipe_ingredient_grams_positive_check',
      sql`${table.gramsHundredths} IS NULL OR ${table.gramsHundredths} > 0`,
    ),
  ],
);

export const recipeImages = pgTable(
  'recipe_image',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    uploadObjectId: text('upload_object_id')
      .notNull()
      .references(() => uploadObjects.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('recipe_image_recipe_id_idx').on(table.recipeId),
    uniqueIndex('recipe_image_recipe_position_idx').on(table.recipeId, table.position),
    uniqueIndex('recipe_image_upload_object_id_idx').on(table.uploadObjectId),
    check('recipe_image_position_non_negative_check', sql`${table.position} >= 0`),
  ],
);

// Deprecated: retained to match existing databases, but app code no longer tracks recipe views.
export const recipeLastViews = pgTable(
  'recipe_last_view',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    viewedAt: timestamp('viewed_at').notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.recipeId] })],
);

import { sql } from 'drizzle-orm';
import { check, date, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth.schema.ts';
import { recipes } from './recipes.schema.ts';

/**
 * One meal a user plans to eat on a date. Plans never count as eaten food; logging one creates a
 * separate food log. Deleting the recipe keeps the plan as a free-text meal under its saved name.
 */
export const mealPlanItems = pgTable(
  'meal_plan_item',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: date('date', { mode: 'string' }).notNull(),
    recipeId: uuid('recipe_id').references(() => recipes.id, { onDelete: 'set null' }),
    /** Free-text meal name, or the recipe name when it was planned, kept if the recipe is deleted. */
    name: text('name').notNull(),
    /** Planned recipe portions in hundredths, e.g. 150 for 1.5 portions. */
    portionsHundredths: integer('portions_hundredths').notNull().default(100),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('meal_plan_item_user_id_date_idx').on(table.userId, table.date),
    index('meal_plan_item_recipe_id_idx').on(table.recipeId),
    check('meal_plan_item_portions_positive_check', sql`${table.portionsHundredths} > 0`),
  ],
);

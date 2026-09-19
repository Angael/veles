import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './auth.schema.ts';

// useful helper: `getSharingFriendsIds`
export const userSharingSettings = pgTable('user_sharing_setting', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  shareCalories: boolean('share_calories').notNull().default(false),
  shareWeight: boolean('share_weight').notNull().default(false),
  shareRecipes: boolean('share_recipes').notNull().default(false),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

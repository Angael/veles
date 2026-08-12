import { createServerFn } from '@tanstack/react-start';
import { desc, eq } from 'drizzle-orm';
import { recipes, weightEntries } from '@veles/db/schema';
import { requireSession } from '@/lib/auth/getSession';
import { db } from '@/lib/db';
import { logMiddleware } from '@/lib/middleware/logMiddleware';

export type HomeDashboardData = {
  recentRecipes: Array<{
    id: string;
    name: string;
    description: string;
    rating: number | null;
    tags: string[];
    updatedAt: string;
    kcal: number | null;
    protein: number | null;
    fat: number | null;
    carbs: number | null;
  }>;
  weightEntries: Array<{
    date: string;
    weightKg: number;
  }>;
};

/** Loads only the compact, recent records needed by the authenticated home dashboard. */
export const getHomeDashboard = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getHomeDashboard')])
  .handler(async (): Promise<HomeDashboardData> => {
    const session = await requireSession();
    const [recipeRows, weightRows] = await Promise.all([
      db
        .select({
          carbs: recipes.carbs,
          description: recipes.description,
          fat: recipes.fats,
          id: recipes.id,
          kcal: recipes.kcal,
          name: recipes.name,
          protein: recipes.protein,
          rating: recipes.rating,
          tags: recipes.tags,
          updatedAt: recipes.updatedAt,
        })
        .from(recipes)
        .where(eq(recipes.userId, session.user.id))
        .orderBy(desc(recipes.updatedAt))
        .limit(3),
      db
        .select({ date: weightEntries.date, weightGrams: weightEntries.weightGrams })
        .from(weightEntries)
        .where(eq(weightEntries.userId, session.user.id))
        .orderBy(desc(weightEntries.date))
        .limit(8),
    ]);

    return {
      recentRecipes: recipeRows.map((recipe) => ({
        ...recipe,
        updatedAt: recipe.updatedAt.toISOString(),
      })),
      weightEntries: weightRows
        .map((entry) => ({ date: entry.date, weightKg: entry.weightGrams / 1_000 }))
        .reverse(),
    };
  });

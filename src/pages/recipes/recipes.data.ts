// The whole file is a mock

export type RecipeImage = {
  url: string;
};

export type RecipeNutrition = {
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
};

export type RecipeListItem = {
  id: string;
  name: string;
  ingredients: string[];
  description: string;
  images: RecipeImage[];
  tags: string[];
  rating: number;
  nutrition: RecipeNutrition;
  createdAt: string;
  updatedAt: string;
};

export type RecipesQueryInput = {
  search: string;
  nutritionDirection: 'gte' | 'lte';
  nutritionValue: number | null;
  ratingDirection: 'gte' | 'lte';
  ratingValue: number | null;
};

export type RecipesQueryResult = {
  recipes: RecipeListItem[];
  appliedFilters: RecipesQueryInput;
};

export type RecipeDetail = RecipeListItem;

const image = (id: string) => ({
  url: `https://picsum.photos/seed/${id}/1200/900`,
});

export const MOCK_RECIPES: RecipeListItem[] = [
  {
    id: '01972f90-8398-7bd5-a5b1-a3d21d7a6101',
    name: 'Smoky Chicken Burrito Bowl',
    ingredients: [
      'Chicken thigh',
      'Rice',
      'Black beans',
      'Corn',
      'Greek yogurt lime sauce',
      'Pickled onion',
    ],
    description:
      'Meal prep bowl with smoky paprika chicken, warm rice, beans, and a sharp yogurt sauce. Built to reheat well and stay satisfying.',
    images: [image('burrito-main'), image('burrito-2'), image('burrito-3')],
    tags: ['meal prep', 'high protein', 'chicken', 'lunch'],
    rating: 5,
    nutrition: {
      kcal: 720,
      protein: 49,
      carbs: 58,
      fats: 29,
    },
    createdAt: '2026-04-10T19:20:00.000Z',
    updatedAt: '2026-05-20T18:05:00.000Z',
  },
  {
    id: '01972f90-8398-7bd5-a5b1-a3d21d7a6102',
    name: 'Miso Butter Salmon Tray',
    ingredients: ['Salmon fillet', 'Miso', 'Butter', 'Broccoli', 'Baby potatoes', 'Sesame'],
    description:
      'One tray dinner with glossy miso butter salmon, crisp-edged potatoes, and broccoli that catches the pan juices.',
    images: [image('salmon-main'), image('salmon-2')],
    tags: ['fish', 'dinner', 'oven', 'weeknight'],
    rating: 4,
    nutrition: {
      kcal: 610,
      protein: 42,
      carbs: 31,
      fats: 34,
    },
    createdAt: '2026-03-02T17:30:00.000Z',
    updatedAt: '2026-05-18T20:44:00.000Z',
  },
  {
    id: '01972f90-8398-7bd5-a5b1-a3d21d7a6103',
    name: 'Soft Egg Kimchi Toast',
    ingredients: ['Sourdough', 'Eggs', 'Kimchi', 'Scallion', 'Cheddar', 'Butter'],
    description:
      'Fast savory breakfast with crisp toast, jammy eggs, and kimchi folded through melted cheddar and butter.',
    images: [image('toast-main')],
    tags: ['breakfast', 'quick', 'eggs', 'spicy'],
    rating: 4,
    nutrition: {
      kcal: 430,
      protein: 22,
      carbs: 29,
      fats: 25,
    },
    createdAt: '2026-05-06T07:15:00.000Z',
    updatedAt: '2026-05-24T07:20:00.000Z',
  },
  {
    id: '01972f90-8398-7bd5-a5b1-a3d21d7a6104',
    name: 'Tomato Lentil Pasta Pot',
    ingredients: ['Red lentils', 'Passata', 'Garlic', 'Pasta shells', 'Parmesan', 'Basil'],
    description:
      'Cheap pantry pasta that eats richer than it is, with lentils melting into the tomato base for body and protein.',
    images: [image('pasta-main'), image('pasta-2'), image('pasta-3')],
    tags: ['vegetarian', 'pasta', 'budget', 'dinner'],
    rating: 3,
    nutrition: {
      kcal: 540,
      protein: 24,
      carbs: 83,
      fats: 11,
    },
    createdAt: '2026-01-16T16:40:00.000Z',
    updatedAt: '2026-05-04T11:10:00.000Z',
  },
  {
    id: '01972f90-8398-7bd5-a5b1-a3d21d7a6105',
    name: 'Skyr Berry Protein Bowl',
    ingredients: ['Skyr', 'Frozen berries', 'Honey', 'Oats', 'Chia seeds', 'Almond butter'],
    description:
      'Cold bowl for mornings when cooking is not happening. Thick, tart, sweet enough, and easy to scale after training.',
    images: [image('skyr-main'), image('skyr-2')],
    tags: ['breakfast', 'high protein', 'cold', 'sweet'],
    rating: 5,
    nutrition: {
      kcal: 390,
      protein: 31,
      carbs: 34,
      fats: 14,
    },
    createdAt: '2026-02-12T08:00:00.000Z',
    updatedAt: '2026-05-12T08:30:00.000Z',
  },
  {
    id: '01972f90-8398-7bd5-a5b1-a3d21d7a6106',
    name: 'No-Picture Cottage Cheese Plate',
    ingredients: ['Cottage cheese', 'Cherry tomatoes', 'Cucumber', 'Olive oil', 'Salt'],
    description:
      'A cold plate for lazy afternoons when assembling beats cooking and the point is mostly protein with crunch.',
    images: [],
    tags: ['quick', 'cold', 'high protein'],
    rating: 3,
    nutrition: {
      kcal: 280,
      protein: 28,
      carbs: 11,
      fats: 13,
    },
    createdAt: '2026-04-28T12:15:00.000Z',
    updatedAt: '2026-05-26T12:20:00.000Z',
  },
  {
    id: '01972f90-8398-7bd5-a5b1-a3d21d7a6107',
    name: 'Sesame Tofu Rice Skillet',
    ingredients: ['Tofu', 'Rice', 'Soy sauce', 'Sesame oil', 'Cabbage', 'Scallion'],
    description:
      'Sticky skillet rice with crisp tofu and cabbage. Good enough to repeat, but macros are still only partly estimated.',
    images: [image('tofu-main'), image('tofu-2'), image('tofu-3')],
    tags: ['tofu', 'dinner', 'skillet'],
    rating: 4,
    nutrition: {
      kcal: null,
      protein: 27,
      carbs: 62,
      fats: 18,
    },
    createdAt: '2026-03-18T18:10:00.000Z',
    updatedAt: '2026-05-22T19:00:00.000Z',
  },
  {
    id: '01972f90-8398-7bd5-a5b1-a3d21d7a6108',
    name: 'Plain Roast Chicken Dinner',
    ingredients: ['Chicken breast', 'Potatoes', 'Carrots', 'Butter', 'Rosemary'],
    description:
      'Straightforward roast dinner kept around because it is reliable, reheats cleanly, and needs almost no thinking.',
    images: [image('roast-main'), image('roast-2')],
    tags: [],
    rating: 4,
    nutrition: {
      kcal: 650,
      protein: 46,
      carbs: 37,
      fats: 31,
    },
    createdAt: '2026-02-02T15:00:00.000Z',
    updatedAt: '2026-05-21T15:30:00.000Z',
  },
];

const MOCK_LAST_VIEWED_BY_USER: Record<string, string[]> = {
  'mock-user': [
    '01972f90-8398-7bd5-a5b1-a3d21d7a6103',
    '01972f90-8398-7bd5-a5b1-a3d21d7a6101',
    '01972f90-8398-7bd5-a5b1-a3d21d7a6105',
  ],
};

export function getMockRecipes(
  input: RecipesQueryInput,
  userId: string | null = null,
): RecipesQueryResult {
  const normalizedInput = normalizeRecipesQueryInput(input);
  const searchedRecipes = MOCK_RECIPES.filter((recipe) =>
    matchesSearch(recipe, normalizedInput.search),
  );
  const filteredRecipes = searchedRecipes.filter((recipe) =>
    matchesNutrition(recipe, normalizedInput),
  );
  const ratingFilteredRecipes = filteredRecipes.filter((recipe) =>
    matchesRating(recipe, normalizedInput),
  );
  const sortedRecipes = sortRecipes(ratingFilteredRecipes, userId);

  return {
    recipes: sortedRecipes,
    appliedFilters: normalizedInput,
  };
}

export function getMockRecipeById(id: string): RecipeDetail | null {
  return MOCK_RECIPES.find((recipe) => recipe.id === id) ?? null;
}

function normalizeRecipesQueryInput(input: RecipesQueryInput): RecipesQueryInput {
  const trimmedSearch = input.search.trim();
  const nutritionValue = Number.isFinite(input.nutritionValue) ? input.nutritionValue : null;
  const ratingValue = Number.isFinite(input.ratingValue) ? input.ratingValue : null;

  return {
    search: trimmedSearch,
    nutritionDirection: input.nutritionDirection,
    nutritionValue,
    ratingDirection: input.ratingDirection,
    ratingValue,
  };
}

function matchesSearch(recipe: RecipeListItem, search: string) {
  if (!search) {
    return true;
  }

  const normalizedSearch = search.toLowerCase();
  const name = recipe.name.toLowerCase();
  const tags = recipe.tags.join(' ').toLowerCase();
  const description = recipe.description.toLowerCase();

  return (
    name.includes(normalizedSearch) ||
    (!name.includes(normalizedSearch) && tags.includes(normalizedSearch)) ||
    (!name.includes(normalizedSearch) &&
      !tags.includes(normalizedSearch) &&
      description.includes(normalizedSearch))
  );
}

function matchesNutrition(recipe: RecipeListItem, input: RecipesQueryInput) {
  if (input.nutritionValue === null) {
    return true;
  }

  const fieldValue = recipe.nutrition.kcal;

  if (fieldValue === null) {
    return false;
  }

  return input.nutritionDirection === 'gte'
    ? fieldValue >= input.nutritionValue
    : fieldValue <= input.nutritionValue;
}

function matchesRating(recipe: RecipeListItem, input: RecipesQueryInput) {
  if (input.ratingValue === null) {
    return true;
  }

  return input.ratingDirection === 'gte'
    ? recipe.rating >= input.ratingValue
    : recipe.rating <= input.ratingValue;
}

function sortRecipes(recipes: RecipeListItem[], userId: string | null) {
  const lastViewedOrder = (userId ? MOCK_LAST_VIEWED_BY_USER[userId] : undefined) ?? [];
  const lastViewedLookup = new Map(lastViewedOrder.map((id, index) => [id, index]));

  return [...recipes].sort((left, right) => {
    const leftLastViewedIndex = lastViewedLookup.get(left.id);
    const rightLastViewedIndex = lastViewedLookup.get(right.id);

    if (leftLastViewedIndex !== undefined || rightLastViewedIndex !== undefined) {
      if (leftLastViewedIndex === undefined) {
        return 1;
      }

      if (rightLastViewedIndex === undefined) {
        return -1;
      }

      return leftLastViewedIndex - rightLastViewedIndex;
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

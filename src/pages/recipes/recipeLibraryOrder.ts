type OrderedRecipe = {
  id: string;
  updatedAt: string;
};

export function compareRecipeLibraryOrder(left: OrderedRecipe, right: OrderedRecipe) {
  return right.updatedAt.localeCompare(left.updatedAt) || right.id.localeCompare(left.id);
}

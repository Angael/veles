export function canManageRecipe(recipeOwnerId: string, viewerId: string | null) {
  return viewerId !== null && recipeOwnerId === viewerId;
}

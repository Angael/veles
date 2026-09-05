import { useMutation } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { updateRecipe, updateRecipeRating } from './recipes.api';
import { createRecipe } from './recipeUpload.api';

export function useCreateRecipeMutation() {
  const createRecipeFn = useServerFn(createRecipe);
  return useMutation({ mutationFn: createRecipeFn });
}

export function useUpdateRecipeRatingMutation() {
  return useMutation({ mutationFn: updateRecipeRating });
}

export function useUpdateRecipeMutation() {
  return useMutation({ mutationFn: updateRecipe });
}

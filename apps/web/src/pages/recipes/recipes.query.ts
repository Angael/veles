import { useMutation } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { updateRecipeRating } from './recipes.api';
import { createRecipe, updateRecipe } from './recipeUpload.api';

export function useCreateRecipeMutation() {
  const createRecipeFn = useServerFn(createRecipe);
  return useMutation({ mutationFn: createRecipeFn });
}

export function useUpdateRecipeRatingMutation() {
  return useMutation({
    meta: {
      error: {
        message: 'Your previous rating was restored. Please try again.',
        priority: 'high',
        title: 'Could not save rating',
      },
    },
    mutationFn: updateRecipeRating,
  });
}

export function useUpdateRecipeMutation() {
  const updateRecipeFn = useServerFn(updateRecipe);
  return useMutation({ mutationFn: updateRecipeFn });
}

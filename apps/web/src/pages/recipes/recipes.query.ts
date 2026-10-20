import { useMutation } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { updateRecipeRating } from './recipes.api';
import { createRecipe, updateRecipe } from './recipeUpload.api';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function useCreateRecipeMutation() {
  const createRecipeFn = useServerFn(createRecipe);
  return useMutation({ mutationFn: createRecipeFn });
}

export function useUpdateRecipeRatingMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: {
        message: t({
          en: 'Your previous rating was restored. Please try again.',
          pl: 'Przywrócono poprzednią ocenę. Spróbuj ponownie.',
        }),
        priority: 'high',
        title: t({ en: 'Could not save rating', pl: 'Nie udało się zapisać oceny' }),
      },
    },
    mutationFn: updateRecipeRating,
  });
}

export function useUpdateRecipeMutation() {
  const updateRecipeFn = useServerFn(updateRecipe);
  return useMutation({ mutationFn: updateRecipeFn });
}

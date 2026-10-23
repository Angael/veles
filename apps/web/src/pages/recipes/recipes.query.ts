import { queryOptions, useMutation } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { calorieDashboardKey } from '@/pages/calories/calories.query';
import { notesQueryKey } from '@/pages/todos/notes.query';
import { addRecipeToNote, logRecipe } from './recipeActions.api';
import { getRecipeById, getRecipeLibrary, updateRecipeRating } from './recipes.api';
import { createRecipe, updateRecipe } from './recipeUpload.api';
import type { addRecipeToNoteInputType, logRecipeInputType } from './recipes.validation';
import { useI18n } from '@/lib/i18n/I18nProvider';

const recipesKey = ['recipes'] as const;

/** Own and shared recipes, e.g. to offer them in the add-food search. */
export function recipeLibraryQueryOptions() {
  return queryOptions({
    queryKey: recipesKey,
    queryFn: () => getRecipeLibrary(),
    staleTime: 30_000,
  });
}

export function recipeQueryOptions(id: string) {
  return queryOptions({
    queryKey: [...recipesKey, id],
    queryFn: () => getRecipeById({ data: { id } }),
    staleTime: 30_000,
  });
}

export function useCreateRecipeMutation() {
  const createRecipeFn = useServerFn(createRecipe);
  return useMutation({ meta: { invalidateQueryKey: recipesKey }, mutationFn: createRecipeFn });
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
  return useMutation({ meta: { invalidateQueryKey: recipesKey }, mutationFn: updateRecipeFn });
}

export function useLogRecipeMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: { title: t({ en: 'Could not add the recipe', pl: 'Nie udało się dodać przepisu' }) },
      invalidateQueryKey: calorieDashboardKey,
    },
    mutationFn: (data: typeof logRecipeInputType.inferIn) => logRecipe({ data }),
  });
}

/** Refreshes notes and the list items query, so an open todos page shows the new lines. */
export function useAddRecipeToNoteMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: {
        title: t({ en: 'Could not add to the note', pl: 'Nie udało się dodać do notatki' }),
      },
      success: { title: t({ en: 'Added to the note', pl: 'Dodano do notatki' }) },
    },
    mutationFn: (data: typeof addRecipeToNoteInputType.inferIn) => addRecipeToNote({ data }),
    onSuccess: (_data, _variables, _onMutateResult, context) =>
      Promise.all([
        context.client.invalidateQueries({ queryKey: notesQueryKey }),
        context.client.invalidateQueries({ queryKey: ['list-items'] }),
      ]),
  });
}

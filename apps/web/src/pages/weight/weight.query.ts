import { useMutation } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { saveWeight, saveWeights } from './weight.api';
import { addWeightEntry, updateWeightEntry } from './weightPhotos.api';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function useSaveWeightMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: {
        message: t({
          en: 'Your weight was not changed. Please try again.',
          pl: 'Waga nie została zmieniona. Spróbuj ponownie.',
        }),
        title: t({ en: 'Could not save weight', pl: 'Nie udało się zapisać wagi' }),
      },
    },
    mutationFn: saveWeight,
  });
}

export function useSaveWeightsMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: {
        message: t({
          en: 'Your entries were not imported. Please try again.',
          pl: 'Wpisy nie zostały zaimportowane. Spróbuj ponownie.',
        }),
        title: t({ en: 'Could not import weights', pl: 'Nie udało się zaimportować wag' }),
      },
    },
    mutationFn: saveWeights,
  });
}

/** Errors are shown inline by the add form so picked files survive a retry. */
export function useAddWeightEntryMutation() {
  const addWeightEntryFn = useServerFn(addWeightEntry);
  return useMutation({ mutationFn: addWeightEntryFn });
}

/** Errors are shown inline by the edit form so picked files survive a retry. */
export function useUpdateWeightEntryMutation() {
  const updateWeightEntryFn = useServerFn(updateWeightEntry);
  return useMutation({ mutationFn: updateWeightEntryFn });
}

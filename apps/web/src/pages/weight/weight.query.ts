import { useMutation } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { saveWeight, saveWeights } from './weight.api';
import { addWeightEntry, updateWeightEntry } from './weightPhotos.api';

export function useSaveWeightMutation() {
  return useMutation({
    meta: {
      error: {
        message: 'Your weight was not changed. Please try again.',
        title: 'Could not save weight',
      },
    },
    mutationFn: saveWeight,
  });
}

export function useSaveWeightsMutation() {
  return useMutation({
    meta: {
      error: {
        message: 'Your entries were not imported. Please try again.',
        title: 'Could not import weights',
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

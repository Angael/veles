import { useMutation } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { saveWeight, saveWeights } from './weight.api';
import { addWeightPhotos, updateWeightEntry } from './weightPhotos.api';

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

/** Upload errors are shown inline by the form so selected files can be retried. */
export function useAddWeightPhotosMutation() {
  const addWeightPhotosFn = useServerFn(addWeightPhotos);
  return useMutation({ mutationFn: addWeightPhotosFn });
}

/** Errors are shown inline by the edit form so picked files survive a retry. */
export function useUpdateWeightEntryMutation() {
  const updateWeightEntryFn = useServerFn(updateWeightEntry);
  return useMutation({ mutationFn: updateWeightEntryFn });
}

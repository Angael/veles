import { useMutation } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { saveWeight, saveWeights } from './weight.api';
import { addWeightPhotos, deleteWeightPhoto } from './weightPhotos.api';

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

export function useDeleteWeightPhotoMutation() {
  return useMutation({
    meta: {
      error: {
        message: 'The photo was kept. Please try again.',
        title: 'Could not remove photo',
      },
    },
    mutationFn: deleteWeightPhoto,
  });
}

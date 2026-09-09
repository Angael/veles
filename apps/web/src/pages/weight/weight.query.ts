import { useMutation } from '@tanstack/react-query';
import { saveWeight, saveWeights } from './weight.api';

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

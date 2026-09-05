import { useMutation } from '@tanstack/react-query';
import { saveWeight, saveWeights } from './weight.api';

export function useSaveWeightMutation() {
  return useMutation({ mutationFn: saveWeight });
}

export function useSaveWeightsMutation() {
  return useMutation({ mutationFn: saveWeights });
}

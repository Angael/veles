import { useMutation } from '@tanstack/react-query';
import { createDiaryEntry, deleteDiaryEntry, updateDiaryEntry } from './diary.api';

export function useCreateDiaryEntryMutation() {
  return useMutation({ mutationFn: createDiaryEntry });
}

export function useDeleteDiaryEntryMutation() {
  return useMutation({ mutationFn: deleteDiaryEntry });
}

export function useUpdateDiaryEntryMutation() {
  return useMutation({ mutationFn: updateDiaryEntry });
}

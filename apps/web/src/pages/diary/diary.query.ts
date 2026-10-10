import { useMutation } from '@tanstack/react-query';
import { toastManager } from '@/components/ui/toast/toastManager';
import { createDiaryEntry, deleteDiaryEntry, updateDiaryEntry } from './diary.api';
import { exportDiaryEntries, importDiaryEntries } from './diaryBackup.api';

export function useCreateDiaryEntryMutation() {
  return useMutation({ mutationFn: createDiaryEntry });
}

export function useDeleteDiaryEntryMutation() {
  return useMutation({ mutationFn: deleteDiaryEntry });
}

export function useUpdateDiaryEntryMutation() {
  return useMutation({ mutationFn: updateDiaryEntry });
}

export function useExportDiaryEntriesMutation() {
  return useMutation({
    meta: { error: { title: 'Diary could not be exported' } },
    mutationFn: () => exportDiaryEntries(),
  });
}

export function useImportDiaryEntriesMutation() {
  return useMutation({
    mutationFn: importDiaryEntries,
    onError: (error) => {
      toastManager.add({
        description: error.message,
        priority: 'high',
        title: 'Diary could not be imported',
        type: 'error',
      });
    },
    onSuccess: ({ importedCount, skippedCount }) => {
      toastManager.add({
        description: skippedCount > 0 ? `Skipped ${skippedCount} existing.` : undefined,
        title: `Imported ${importedCount} ${importedCount === 1 ? 'entry' : 'entries'}`,
        type: 'success',
      });
    },
  });
}

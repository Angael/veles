import { useRouter } from '@tanstack/react-router';
import { DownloadIcon, UploadIcon } from 'lucide-react';
import { useRef } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { todayLocalDate } from '@/lib/dateOnly';
import { downloadTextFile } from '@/lib/downloadTextFile';
import { useExportDiaryEntriesMutation, useImportDiaryEntriesMutation } from './diary.query';
import css from './DiaryBackupActions.module.css';

type DiaryBackupActionsProps = {
  canExport: boolean;
};

export function DiaryBackupActions({ canExport }: DiaryBackupActionsProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportMutation = useExportDiaryEntriesMutation();
  const importMutation = useImportDiaryEntriesMutation();

  function handleExport() {
    exportMutation.mutate(undefined, {
      onSuccess: (backup) => {
        downloadTextFile(
          `veles-diary-${todayLocalDate()}.json`,
          JSON.stringify(backup, null, 2),
          'application/json',
        );
      },
    });
  }

  async function handleFileChange(file: File | undefined) {
    if (!file) {
      return;
    }

    const json = await file.text();
    importMutation.mutate(
      { data: { json } },
      { onSuccess: () => void router.invalidate().catch(() => undefined) },
    );
  }

  return (
    <div className={css.actions}>
      {canExport ? (
        <Btn
          icon={<DownloadIcon aria-hidden='true' />}
          loading={exportMutation.isPending}
          onClick={handleExport}
          size='sm'
          variant='ghost'
        >
          Export
        </Btn>
      ) : null}
      <Btn
        icon={<UploadIcon aria-hidden='true' />}
        loading={importMutation.isPending}
        onClick={() => fileInputRef.current?.click()}
        size='sm'
        variant='ghost'
      >
        Import
      </Btn>
      <input
        accept='application/json,.json'
        className={css.fileInput}
        onChange={(event) => {
          const input = event.currentTarget;
          void handleFileChange(input.files?.[0]).finally(() => {
            input.value = '';
          });
        }}
        ref={fileInputRef}
        type='file'
      />
    </div>
  );
}

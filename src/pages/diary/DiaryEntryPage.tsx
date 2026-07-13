import { useMutation } from '@tanstack/react-query';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { Trash2Icon } from 'lucide-react';
import { Card } from '@/components/card/Card';
import { Btn } from '@/components/btn/Btn';
import { SeamlessTextInput } from '@/components/seamless-text-input/SeamlessTextInput';
import { SeamlessTextarea } from '@/components/seamless-textarea/SeamlessTextarea';
import { useAutoSaveState } from '@/lib/hooks/useAutoSaveState';
import { type DiaryEntrySummary, deleteDiaryEntry, updateDiaryEntry } from './diary.api';
import css from './DiaryEntryPage.module.css';

type DiaryEntryPageProps = {
  entry: DiaryEntrySummary;
};

export function DiaryEntryPage({ entry }: DiaryEntryPageProps) {
  const navigate = useNavigate();
  const router = useRouter();

  const saveMutation = useMutation({
    mutationFn: updateDiaryEntry,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDiaryEntry,
    onSuccess: async () => {
      await navigate({ to: '/diary' });
      await router.invalidate();
    },
  });

  const [draft, setDraft] = useAutoSaveState(
    { id: entry.id, markdown: entry.markdown, title: entry.title },
    (nextDraft) => saveMutation.mutate({ data: nextDraft }),
    { debounceMs: 400, deps: [entry.id, entry.markdown, entry.title] },
  );

  return (
    <main className={css.page}>
      <article>
        <header className={css.header}>
          <div className={css.headerActions}>
            <time dateTime={entry.entryAt}>{formatDiaryDate(entry.entryAt)}</time>
            <Btn
              aria-label='Delete diary entry'
              icon={<Trash2Icon aria-hidden='true' size={16} strokeWidth={1.9} />}
              iconOnly
              loading={deleteMutation.isPending}
              onClick={() => {
                if (window.confirm(`Delete “${draft.title}”? This cannot be undone.`)) {
                  deleteMutation.mutate({ data: { id: entry.id } });
                }
              }}
              size='sm'
              type='button'
              variant='ghostDanger'
            />
          </div>
          <h1>
            <SeamlessTextInput
              aria-label='Diary entry title'
              className={css.titleInput}
              maxLength={999}
              onChange={(event) => {
                setDraft((currentDraft) => ({ ...currentDraft, title: event.target.value }));
              }}
              value={draft.title}
            />
          </h1>
        </header>
        <Card as='section' className={css.body}>
          <SeamlessTextarea
            aria-label='Diary entry'
            className={css.editor}
            maxLength={15_999}
            onChange={(event) => {
              setDraft((currentDraft) => ({ ...currentDraft, markdown: event.target.value }));
            }}
            value={draft.markdown}
          />
          <p aria-live='polite' className={css.saveState}>
            {saveMutation.isError
              ? 'Changes could not be saved.'
              : saveMutation.isPending
                ? 'Saving...'
                : 'Saved'}
          </p>
        </Card>
      </article>
    </main>
  );
}

function formatDiaryDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(value));
}

import { useNavigate, useRouter } from '@tanstack/react-router';
import { Trash2Icon } from 'lucide-react';
import { Card } from '@/components/card/Card';
import { Btn } from '@/components/btn/Btn';
import { DateInput } from '@/components/date-input/DateInput';
import { SeamlessTextInput } from '@/components/seamless-text-input/SeamlessTextInput';
import { SeamlessTextarea } from '@/components/seamless-textarea/SeamlessTextarea';
import { useAutoSaveState } from '@/lib/hooks/useAutoSaveState';
import type { DiaryEntrySummary } from './diary.api';
import { useDeleteDiaryEntryMutation, useUpdateDiaryEntryMutation } from './diary.query';
import css from './DiaryEntryPage.module.css';

type DiaryEntryPageProps = {
  entry: DiaryEntrySummary;
  focusTitle?: boolean;
};

export function DiaryEntryPage({ entry, focusTitle = false }: DiaryEntryPageProps) {
  const navigate = useNavigate();
  const router = useRouter();

  const saveMutation = useUpdateDiaryEntryMutation();
  const deleteMutation = useDeleteDiaryEntryMutation();

  const [draft, setDraft] = useAutoSaveState(
    {
      entryDate: entry.entryDate,
      id: entry.id,
      markdown: entry.markdown,
      title: entry.title,
    },
    (nextDraft) => saveMutation.mutate({ data: nextDraft }),
    {
      debounceMs: 400,
      deps: [entry.entryDate, entry.id, entry.markdown, entry.title],
    },
  );

  return (
    <main className={css.page}>
      <article>
        <header className={css.header}>
          <div className={css.headerActions}>
            <DateInput
              aria-label='Diary entry date'
              className={css.dateInput}
              max='9999-12-31'
              onChange={(event) => {
                // Native constraint validation covers `required`, malformed dates, and the `max`
                // year above, so oversized values never enter autosave state.
                if (!event.currentTarget.validity.valid || !event.currentTarget.value) {
                  return;
                }

                setDraft((currentDraft) => ({
                  ...currentDraft,
                  entryDate: event.target.value,
                }));
              }}
              required
              value={draft.entryDate}
            />
            <Btn
              aria-label='Delete diary entry'
              icon={<Trash2Icon aria-hidden='true' size={16} strokeWidth={1.9} />}
              iconOnly
              loading={deleteMutation.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    `Delete “${draft.title || 'Untitled entry'}”? This cannot be undone.`,
                  )
                ) {
                  deleteMutation.mutate(
                    { data: { id: entry.id } },
                    {
                      onSuccess: async () => {
                        await navigate({ to: '/diary' });
                        await router.invalidate();
                      },
                    },
                  );
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
              autoFocus={focusTitle}
              className={css.titleInput}
              maxLength={160}
              onChange={(event) => {
                setDraft((currentDraft) => ({ ...currentDraft, title: event.target.value }));
              }}
              placeholder='Untitled entry'
              value={draft.title}
            />
          </h1>
        </header>
        <Card as='section' className={css.body}>
          <SeamlessTextarea
            aria-label='Diary entry'
            className={css.editor}
            maxLength={16000}
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

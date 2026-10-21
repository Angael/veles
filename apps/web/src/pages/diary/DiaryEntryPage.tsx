import { useNavigate, useRouter } from '@tanstack/react-router';
import { LockIcon, Trash2Icon } from 'lucide-react';
import { useMemo } from 'react';
import { Card } from '@/components/ui/card/Card';
import { Btn } from '@/components/ui/btn/Btn';
import { DateInput } from '@/components/ui/date-input/DateInput';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { SeamlessTextarea } from '@/components/ui/seamless-textarea/SeamlessTextarea';
import { useAutoSaveState } from './useAutoSaveState';
import type { EncryptedDiaryEntry } from './diary.api';
import { useDeleteDiaryEntryMutation, useUpdateDiaryEntryMutation } from './diary.query';
import type { DiaryKeyRecord } from './diaryCrypto';
import { DiaryLockGate } from './DiaryLockGate';
import { type DiaryEntrySummary, useDecryptedEntries } from './useDecryptedEntries';
import css from './DiaryEntryPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type DiaryEntryPageProps = {
  entry: EncryptedDiaryEntry;
  keyRecord: DiaryKeyRecord | null;
};

type DiaryEntryEditorProps = {
  diaryKey: CryptoKey;
  entry: DiaryEntrySummary;
  onLock: () => void;
};

export function DiaryEntryPage({ entry, keyRecord }: DiaryEntryPageProps) {
  const encryptedEntries = useMemo(() => [entry], [entry]);

  return (
    <DiaryLockGate keyRecord={keyRecord}>
      {(diaryKey, lock) => (
        <DecryptedDiaryEntry
          diaryKey={diaryKey}
          encryptedEntries={encryptedEntries}
          onLock={lock}
        />
      )}
    </DiaryLockGate>
  );
}

function DecryptedDiaryEntry({
  encryptedEntries,
  ...props
}: Omit<DiaryEntryEditorProps, 'entry'> & { encryptedEntries: EncryptedDiaryEntry[] }) {
  const { t } = useI18n();
  const decrypted = useDecryptedEntries(props.diaryKey, encryptedEntries);
  const entry = decrypted?.entries[0];

  if (!decrypted) return null;
  if (!entry) {
    return (
      <p className={css.decryptError} role='alert'>
        {t({
          en: 'This entry could not be decrypted.',
          pl: 'Nie udało się odszyfrować tego wpisu.',
        })}
      </p>
    );
  }
  return <DiaryEntryEditor {...props} entry={entry} />;
}

function DiaryEntryEditor({ diaryKey, entry, onLock }: DiaryEntryEditorProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const router = useRouter();
  const untitled = t({ en: 'Untitled entry', pl: 'Wpis bez tytułu' });

  const saveMutation = useUpdateDiaryEntryMutation(diaryKey);
  const deleteMutation = useDeleteDiaryEntryMutation();

  const [draft, setDraft] = useAutoSaveState(
    {
      entryDate: entry.entryDate,
      id: entry.id,
      markdown: entry.markdown,
      title: entry.title,
    },
    (nextDraft) => saveMutation.mutate(nextDraft),
    {
      debounceMs: 400,
      deps: [entry.entryDate, entry.id, entry.markdown, entry.title],
    },
  );
  let saveState = t({ en: 'Saved', pl: 'Zapisano' });
  if (saveMutation.isPending) saveState = t({ en: 'Saving...', pl: 'Zapisywanie...' });
  if (saveMutation.isError) {
    saveState = t({ en: 'Changes could not be saved.', pl: 'Nie udało się zapisać zmian.' });
  }

  return (
    <main className={css.page}>
      <article>
        <header className={css.header}>
          <div className={css.headerActions}>
            <DateInput
              aria-label={t({ en: 'Diary entry date', pl: 'Data wpisu' })}
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
            <div className={css.headerButtons}>
              <Btn
                aria-label={t({ en: 'Lock diary', pl: 'Zablokuj dziennik' })}
                icon={<LockIcon aria-hidden='true' size={16} strokeWidth={1.9} />}
                iconOnly
                onClick={onLock}
                size='sm'
                type='button'
                variant='ghost'
              />
              <Btn
                aria-label={t({ en: 'Delete diary entry', pl: 'Usuń wpis' })}
                icon={<Trash2Icon aria-hidden='true' size={16} strokeWidth={1.9} />}
                iconOnly
                loading={deleteMutation.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      t({
                        en: `Delete “${draft.title || untitled}”? This cannot be undone.`,
                        pl: `Usunąć „${draft.title || untitled}”? Tego nie można cofnąć.`,
                      }),
                    )
                  ) {
                    deleteMutation.mutate(
                      { data: { id: entry.id } },
                      {
                        onSuccess: () => {
                          void navigate({ replace: true, to: '/diary' })
                            .then(() => router.invalidate())
                            .catch(() => undefined);
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
          </div>
          <h1>
            <SeamlessTextInput
              aria-label={t({ en: 'Diary entry title', pl: 'Tytuł wpisu' })}
              className={css.titleInput}
              maxLength={160}
              onChange={(event) => {
                setDraft((currentDraft) => ({ ...currentDraft, title: event.target.value }));
              }}
              placeholder={untitled}
              value={draft.title}
            />
          </h1>
        </header>
        <Card as='section' className={css.body}>
          <SeamlessTextarea
            aria-label={t({ en: 'Diary entry', pl: 'Wpis w dzienniku' })}
            className={css.editor}
            maxLength={16000}
            onChange={(event) => {
              setDraft((currentDraft) => ({ ...currentDraft, markdown: event.target.value }));
            }}
            value={draft.markdown}
          />
          <p aria-live='polite' className={css.saveState}>
            {saveState}
          </p>
        </Card>
      </article>
    </main>
  );
}

import { Link, useNavigate, useRouter } from '@tanstack/react-router';
import { LockIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { FloatingButton } from '@/components/ui/floating-button/FloatingButton';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { filterAndRankBySearch, type RankedSearchFields } from '@/lib/search/filterAndRankBySearch';
import type { EncryptedDiaryEntry } from './diary.api';
import { useCreateDiaryEntryMutation } from './diary.query';
import type { DiaryKeyRecord } from './diaryCrypto';
import { DiaryBackupActions } from './DiaryBackupActions';
import { DiaryLockGate } from './DiaryLockGate';
import { type DiaryEntrySummary, useDecryptedEntries } from './useDecryptedEntries';
import css from './DiaryListPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type DiaryListPageProps = {
  entries: EncryptedDiaryEntry[];
  keyRecord: DiaryKeyRecord | null;
};

type DiaryListProps = {
  diaryKey: CryptoKey;
  encryptedEntries: EncryptedDiaryEntry[];
  onLock: () => void;
};

const diarySearchFields = [
  (entry) => entry.title,
  (entry) => entry.markdown,
] satisfies RankedSearchFields<DiaryEntrySummary>;

export function DiaryListPage({ entries, keyRecord }: DiaryListPageProps) {
  return (
    <DiaryLockGate keyRecord={keyRecord}>
      {(diaryKey, lock) => (
        <DiaryList diaryKey={diaryKey} encryptedEntries={entries} onLock={lock} />
      )}
    </DiaryLockGate>
  );
}

function DiaryList({ diaryKey, encryptedEntries, onLock }: DiaryListProps) {
  const { formatDate, t } = useI18n();
  const navigate = useNavigate();
  const router = useRouter();
  const [searchInputValue, setSearchInputValue] = useState('');
  const decrypted = useDecryptedEntries(diaryKey, encryptedEntries);
  const entries = decrypted?.entries ?? [];
  const visibleEntries = filterAndRankBySearch(entries, searchInputValue, diarySearchFields);
  const createMutation = useCreateDiaryEntryMutation();

  if (!decrypted) return null;

  return (
    <main className={css.page}>
      <div className={css.toolbar}>
        <DiaryBackupActions diaryKey={diaryKey} entries={entries} />
        <Btn icon={<LockIcon aria-hidden='true' />} onClick={onLock} size='sm' variant='ghost'>
          {t({ en: 'Lock', pl: 'Zablokuj' })}
        </Btn>
      </div>

      {decrypted.error ? (
        <p className={css.createError} role='alert'>
          {t({
            en: 'Your entries could not be decrypted.',
            pl: 'Nie udało się odszyfrować wpisów.',
          })}
        </p>
      ) : null}

      {createMutation.isError ? (
        <p className={css.createError} role='alert'>
          {t({
            en: 'The entry could not be created. Try again.',
            pl: 'Nie udało się utworzyć wpisu. Spróbuj ponownie.',
          })}
        </p>
      ) : null}

      {!decrypted.error &&
        (entries.length === 0 ? (
          <Card as='section' className={css.emptyState} data-appear>
            <h1>{t({ en: 'No diary entries yet', pl: 'Brak wpisów w dzienniku' })}</h1>
          </Card>
        ) : (
          <>
            <label className={css.searchField} data-appear>
              <span className={css.searchLabel}>
                {t({ en: 'Search entries', pl: 'Szukaj wpisów' })}
              </span>
              <TextInput
                aria-label={t({ en: 'Search diary entries', pl: 'Szukaj wpisów w dzienniku' })}
                autoComplete='off'
                name='search'
                onValueChange={setSearchInputValue}
                placeholder={t({
                  en: 'Search titles and entries',
                  pl: 'Szukaj w tytułach i treści',
                })}
                type='search'
                value={searchInputValue}
              />
            </label>

            {visibleEntries.length === 0 ? (
              <Card as='section' className={css.emptyState} data-appear='1'>
                <h1>{t({ en: 'No matching entries', pl: 'Brak pasujących wpisów' })}</h1>
                <p>
                  {t({
                    en: 'Try a different title or phrase from an entry.',
                    pl: 'Spróbuj innego tytułu lub frazy z wpisu.',
                  })}
                </p>
              </Card>
            ) : (
              <section
                aria-label={t({ en: 'Diary entries', pl: 'Wpisy w dzienniku' })}
                className={css.list}
                data-appear='1'
              >
                {visibleEntries.map((entry) => (
                  <Link
                    className={css.entryLink}
                    key={entry.id}
                    params={{ id: entry.id }}
                    to='/diary/$id'
                  >
                    <Card as='article' className={css.entry}>
                      <time className={css.date} dateTime={entry.entryDate}>
                        {formatDate(entry.entryDate, {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </time>
                      <h2>{entry.title || t({ en: 'Untitled entry', pl: 'Wpis bez tytułu' })}</h2>
                      {entry.markdown ? <p className={css.preview}>{entry.markdown}</p> : null}
                    </Card>
                  </Link>
                ))}
              </section>
            )}
          </>
        ))}

      <FloatingButton
        icon={<PlusIcon aria-hidden='true' />}
        loading={createMutation.isPending}
        onClick={() => {
          createMutation.mutate(
            { data: { entryDate: getLocalDate() } },
            {
              onSuccess: (entry) => {
                void navigate({
                  params: { id: entry.id },
                  to: '/diary/$id',
                })
                  .then(() => router.invalidate())
                  .catch(() => undefined);
              },
            },
          );
        }}
      >
        {t({ en: 'New entry', pl: 'Nowy wpis' })}
      </FloatingButton>
    </main>
  );
}

function getLocalDate() {
  const now = new Date();
  const localNow = new Date(now.valueOf() - now.getTimezoneOffset() * 60_000);
  return localNow.toISOString().slice(0, 10);
}

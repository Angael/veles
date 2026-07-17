import { useMutation } from '@tanstack/react-query';
import { useThrottledValue } from '@tanstack/react-pacer';
import { Link, useNavigate, useRouter } from '@tanstack/react-router';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/card/Card';
import { FloatingButton } from '@/components/floating-button/FloatingButton';
import { TextInput } from '@/components/text-input/TextInput';
import { createDiaryEntry, type DiaryEntrySummary } from './diary.api';
import css from './DiaryListPage.module.css';

type DiaryListPageProps = {
  entries: DiaryEntrySummary[];
};

export function DiaryListPage({ entries }: DiaryListPageProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const [searchInputValue, setSearchInputValue] = useState('');
  const [search] = useThrottledValue(searchInputValue, { wait: 200 });
  const visibleEntries = rankDiaryEntriesBySearch(entries, search);
  const createMutation = useMutation({
    mutationFn: createDiaryEntry,
    onSuccess: async (entry) => {
      await navigate({
        params: { id: entry.id },
        search: { created: '1' },
        to: '/diary/$id',
      });
      await router.invalidate();
    },
  });

  return (
    <main className={css.page}>
      {createMutation.isError ? (
        <p className={css.createError} role='alert'>
          The entry could not be created. Try again.
        </p>
      ) : null}

      {entries.length === 0 ? (
        <Card as='section' className={css.emptyState}>
          <h1>No diary entries yet</h1>
        </Card>
      ) : (
        <>
          <label className={css.searchField}>
            <span className={css.searchLabel}>Search entries</span>
            <TextInput
              aria-label='Search diary entries'
              autoComplete='off'
              name='search'
              onValueChange={setSearchInputValue}
              placeholder='Search titles and entries'
              type='search'
              value={searchInputValue}
            />
          </label>

          {visibleEntries.length === 0 ? (
            <Card as='section' className={css.emptyState}>
              <h1>No matching entries</h1>
              <p>Try a different title or phrase from an entry.</p>
            </Card>
          ) : (
            <section aria-label='Diary entries' className={css.list}>
              {visibleEntries.map((entry) => (
                <Link
                  className={css.entryLink}
                  key={entry.id}
                  params={{ id: entry.id }}
                  to='/diary/$id'
                >
                  <Card as='article' className={css.entry}>
                    <time className={css.date} dateTime={entry.entryDate}>
                      {formatDiaryDate(entry.entryDate)}
                    </time>
                    <h2>{entry.title || 'Untitled entry'}</h2>
                    {entry.markdown ? <p className={css.preview}>{entry.markdown}</p> : null}
                  </Card>
                </Link>
              ))}
            </section>
          )}
        </>
      )}

      <FloatingButton
        icon={<PlusIcon aria-hidden='true' />}
        loading={createMutation.isPending}
        onClick={() => {
          createMutation.mutate({ data: { entryDate: getLocalDate() } });
        }}
      >
        New entry
      </FloatingButton>
    </main>
  );
}

function formatDiaryDate(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

function getLocalDate() {
  const now = new Date();
  const localNow = new Date(now.valueOf() - now.getTimezoneOffset() * 60_000);
  return localNow.toISOString().slice(0, 10);
}

/** Filters and sorts matching entries so title hits appear before entry-content hits. */
function rankDiaryEntriesBySearch(entries: DiaryEntrySummary[], search: string) {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return entries;
  }

  return entries
    .flatMap((entry, index) => {
      if (entry.title.toLowerCase().includes(normalizedSearch)) {
        return [{ entry, index, rank: 0 }];
      }

      if (entry.markdown.toLowerCase().includes(normalizedSearch)) {
        return [{ entry, index, rank: 1 }];
      }

      return [];
    })
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .map((result) => result.entry);
}

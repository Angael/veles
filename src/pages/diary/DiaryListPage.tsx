import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Card } from '@/components/card/Card';
import { TextInput } from '@/components/text-input/TextInput';
import { useThrottledValue } from '@/lib/hooks/useThrottledValue';
import type { DiaryEntrySummary } from './diary.api';
import css from './DiaryListPage.module.css';

type DiaryListPageProps = {
  entries: DiaryEntrySummary[];
};

export function DiaryListPage({ entries }: DiaryListPageProps) {
  const [searchInputValue, setSearchInputValue] = useState('');
  const [search] = useThrottledValue(searchInputValue, 200);
  const visibleEntries = rankDiaryEntriesBySearch(entries, search);

  if (entries.length === 0) {
    return (
      <main className={css.page}>
        <Card as='section' className={css.emptyState}>
          <h1>No diary entries yet</h1>
        </Card>
      </main>
    );
  }

  return (
    <main className={css.page}>
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
                <time className={css.date} dateTime={entry.entryAt}>
                  {formatDiaryDate(entry.entryAt)}
                </time>
                <h2>{entry.title}</h2>
                {entry.markdown ? <p className={css.preview}>{entry.markdown}</p> : null}
              </Card>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}

function formatDiaryDate(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date(value));
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

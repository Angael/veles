import { Link } from '@tanstack/react-router';
import { Card } from '@/components/card/Card';
import type { DiaryEntrySummary } from './diary.api';
import css from './DiaryListPage.module.css';

type DiaryListPageProps = {
  entries: DiaryEntrySummary[];
};

export function DiaryListPage({ entries }: DiaryListPageProps) {
  return (
    <main className={css.page}>
      {entries.length === 0 ? (
        <Card as='section' className={css.emptyState}>
          <h1>No diary entries yet</h1>
          <p>Imported Penzu entries will appear here.</p>
        </Card>
      ) : (
        <section aria-label='Diary entries' className={css.list}>
          {entries.map((entry) => (
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

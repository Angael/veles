import { Card } from '@/components/card/Card';
import type { DiaryEntrySummary } from './diary.api';
import css from './DiaryEntryPage.module.css';

type DiaryEntryPageProps = {
  entry: DiaryEntrySummary;
};

export function DiaryEntryPage({ entry }: DiaryEntryPageProps) {
  return (
    <main className={css.page}>
      <article>
        <header className={css.header}>
          <time dateTime={entry.entryAt}>{formatDiaryDate(entry.entryAt)}</time>
          <h1>{entry.title}</h1>
        </header>
        <Card as='section' className={css.body}>
          <pre>{entry.markdown}</pre>
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

import { createFileRoute } from '@tanstack/react-router';
import { DiaryListPage } from '@/pages/diary/DiaryListPage';
import { getDiaryEntries } from '@/pages/diary/diary.api';
import { translate } from '@/lib/i18n/getLocale';

export const Route = createFileRoute('/_authenticated/diary/')({
  loader: () => getDiaryEntries(),
  component: RouteComponent,
  head: () => ({ meta: [{ title: translate({ en: 'Diary', pl: 'Dziennik' }) }] }),
  staticData: { navbar: { label: { en: 'Diary', pl: 'Dziennik' } } },
});

function RouteComponent() {
  const { entries, keyRecord } = Route.useLoaderData();

  return <DiaryListPage entries={entries} keyRecord={keyRecord} />;
}

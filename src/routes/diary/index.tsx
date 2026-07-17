import { createFileRoute } from '@tanstack/react-router';
import { DiaryListPage } from '@/pages/diary/DiaryListPage';
import { getDiaryEntries } from '@/pages/diary/diary.api';

export const Route = createFileRoute('/diary/')({
  loader: () => getDiaryEntries(),
  component: RouteComponent,
  head: () => ({ meta: [{ title: 'Diary' }] }),
  staticData: { navbar: { label: 'Diary', upTo: { to: '/' } } },
});

function RouteComponent() {
  const entries = Route.useLoaderData();

  return <DiaryListPage entries={entries} />;
}

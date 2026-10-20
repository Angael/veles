import { type } from 'arktype';
import { createFileRoute } from '@tanstack/react-router';
import { DiaryEntryPage } from '@/pages/diary/DiaryEntryPage';
import { getDiaryEntryById } from '@/pages/diary/diary.api';
import { translate } from '@/lib/i18n/getLocale';

export const Route = createFileRoute('/_authenticated/diary/$id')({
  validateSearch: type({ 'created?': "'1'" }),
  loader: async ({ params }) => {
    return getDiaryEntryById({ data: { id: params.id } });
  },
  component: RouteComponent,
  head: () => ({ meta: [{ title: translate({ en: 'Diary entry', pl: 'Wpis w dzienniku' }) }] }),
  staticData: {
    navbar: {
      backFallback: { to: '/diary' },
      label: { en: 'Diary entry', pl: 'Wpis w dzienniku' },
    },
  },
});

function RouteComponent() {
  const { entry, keyRecord } = Route.useLoaderData();
  const search = Route.useSearch();
  return <DiaryEntryPage entry={entry} focusTitle={search.created === '1'} keyRecord={keyRecord} />;
}

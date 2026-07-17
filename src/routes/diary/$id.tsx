import { type } from 'arktype';
import { createFileRoute } from '@tanstack/react-router';
import { DiaryEntryPage } from '@/pages/diary/DiaryEntryPage';
import { getDiaryEntryById } from '@/pages/diary/diary.api';

export const Route = createFileRoute('/diary/$id')({
  validateSearch: type({ 'created?': "'1'" }),
  loader: async ({ params }) => {
    return getDiaryEntryById({ data: { id: params.id } });
  },
  component: RouteComponent,
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData?.title || 'Untitled entry' }],
  }),
  staticData: { navbar: { label: 'Diary entry', upTo: { to: '/diary' } } },
});

function RouteComponent() {
  const entry = Route.useLoaderData();
  const search = Route.useSearch();
  return <DiaryEntryPage entry={entry} focusTitle={search.created === '1'} />;
}

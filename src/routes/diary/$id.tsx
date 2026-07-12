import { createFileRoute, notFound } from '@tanstack/react-router';
import { DiaryEntryPage } from '@/pages/diary/DiaryEntryPage';
import { getDiaryEntryById } from '@/pages/diary/diary.api';

export const Route = createFileRoute('/diary/$id')({
  loader: async ({ params }) => {
    const entry = await getDiaryEntryById({ data: { id: params.id } });

    if (!entry) {
      throw notFound();
    }

    return entry;
  },
  component: RouteComponent,
  head: ({ loaderData }) => ({ meta: [{ title: loaderData?.title ?? 'Diary entry' }] }),
  staticData: { navbar: { label: 'Diary entry', upTo: { to: '/diary' } } },
});

function RouteComponent() {
  const entry = Route.useLoaderData();

  return <DiaryEntryPage entry={entry} />;
}

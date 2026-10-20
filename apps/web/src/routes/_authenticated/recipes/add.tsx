import { createFileRoute } from '@tanstack/react-router';
import { AddRecipePage } from '@/pages/recipes/editor/AddRecipePage';
import { translate } from '@/lib/i18n/getLocale';

export const Route = createFileRoute('/_authenticated/recipes/add')({
  ssr: false,
  component: AddRecipePage,

  head: () => ({ meta: [{ title: translate({ en: 'Add recipe', pl: 'Dodaj przepis' }) }] }),
  staticData: {
    layout: 'task',
    navbar: { backFallback: { to: '/recipes' }, label: { en: 'Add recipe', pl: 'Dodaj przepis' } },
  },
});

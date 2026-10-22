import { type } from 'arktype';
import { createFileRoute } from '@tanstack/react-router';
import { AddRecipePage } from '@/pages/recipes/editor/AddRecipePage';
import { recipeDraftFromLogs } from '@/pages/recipes/editor/recipeDraftFromLogs';
import {
  getRecipeSourceLogs,
  recipeSourceLogIdsType,
} from '@/pages/recipes/editor/recipeFromLogs.api';
import { translate } from '@/lib/i18n/getLocale';
import { useI18n } from '@/lib/i18n/I18nProvider';

export const Route = createFileRoute('/_authenticated/recipes/add')({
  validateSearch: type({ 'fromLogs?': recipeSourceLogIdsType }),
  loaderDeps: ({ search }) => ({ fromLogs: search.fromLogs ?? [] }),
  ssr: false,
  loader: ({ deps }) =>
    deps.fromLogs.length ? getRecipeSourceLogs({ data: { ids: deps.fromLogs } }) : [],
  component: RouteComponent,

  head: () => ({ meta: [{ title: translate({ en: 'Add recipe', pl: 'Dodaj przepis' }) }] }),
  staticData: {
    layout: 'task',
    navbar: { backFallback: { to: '/recipes' }, label: { en: 'Add recipe', pl: 'Dodaj przepis' } },
  },
});

function RouteComponent() {
  const sourceLogs = Route.useLoaderData();
  const { formatNumber } = useI18n();
  const initialDraft = sourceLogs.length
    ? recipeDraftFromLogs(sourceLogs, (grams) => formatNumber(grams, { maximumFractionDigits: 1 }))
    : undefined;

  return <AddRecipePage initialDraft={initialDraft} />;
}

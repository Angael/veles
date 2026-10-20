import { type QueryClient, useMutation } from '@tanstack/react-query';
import type { CalorieDashboardDay } from '../calories.api';
import { calorieDashboardQueryOptions } from '../calories.query';
import { setFoodDayNote } from './foodDayNote.api';

type SetFoodDayNoteVariables = { date: string; offPlan?: boolean; note?: string };

function patchDashboardDay(
  client: QueryClient,
  date: string,
  patch: Partial<Pick<CalorieDashboardDay, 'note' | 'offPlan'>>,
) {
  client.setQueryData(
    calorieDashboardQueryOptions(date).queryKey,
    (dashboard) =>
      dashboard && {
        ...dashboard,
        days: dashboard.days.map((day) => (day.date === date ? { ...day, ...patch } : day)),
      },
  );
}

/** Saves a day's note or off-plan flag and patches the cached week instead of refetching it. */
export function useSetFoodDayNoteMutation() {
  return useMutation({
    meta: { error: { title: 'Could not save the day note' } },
    mutationFn: (data: SetFoodDayNoteVariables) => setFoodDayNote({ data }),
    onMutate: async ({ date, note, offPlan }, context) => {
      await context.client.cancelQueries({
        queryKey: calorieDashboardQueryOptions(date).queryKey,
      });
      patchDashboardDay(context.client, date, {
        ...(offPlan === undefined ? {} : { offPlan }),
        ...(note === undefined ? {} : { note: note.trim() || null }),
      });
    },
    // Only the sent fields: a note save must not undo a flag change that is still in flight.
    onSuccess: (saved, variables, _onMutateResult, context) =>
      patchDashboardDay(context.client, saved.date, {
        ...('offPlan' in variables ? { offPlan: saved.offPlan } : {}),
        ...('note' in variables ? { note: saved.note } : {}),
      }),
    onError: (_error, { date }, _onMutateResult, context) =>
      context.client.invalidateQueries({
        queryKey: calorieDashboardQueryOptions(date).queryKey,
      }),
  });
}

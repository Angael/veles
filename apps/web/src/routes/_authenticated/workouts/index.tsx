import { type } from 'arktype';
import { createFileRoute } from '@tanstack/react-router';
import { monthOf } from '@/pages/workouts/dashboard/calendar/calendarDates';
import { workoutCalendarQueryOptions } from '@/pages/workouts/dashboard/dashboard.query';
import { WorkoutsDashboardPage } from '@/pages/workouts/dashboard/WorkoutsDashboardPage';
import { routinesQueryOptions } from '@/pages/workouts/routines/routines.query';
import { workoutsQueryOptions } from '@/pages/workouts/workouts.query';
import { dateOnlyType, todayLocalDate } from '@/lib/dateOnly';
import { translate } from '@/lib/i18n/getLocale';

const searchType = type({ 'date?': 'string' });

/** A hand-edited `?date=` falls back to today instead of breaking the page. */
const validDate = (date: string | undefined) => (dateOnlyType.allows(date) ? date : undefined);

export const Route = createFileRoute('/_authenticated/workouts/')({
  validateSearch: searchType,
  beforeLoad: ({ search }) => ({
    calendarMonth: monthOf(validDate(search.date) ?? todayLocalDate()),
  }),
  loader: ({ context: { calendarMonth, queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(workoutsQueryOptions()),
      queryClient.ensureQueryData(routinesQueryOptions()),
      queryClient.ensureQueryData(workoutCalendarQueryOptions(calendarMonth)),
    ]),
  component: RouteComponent,
  head: () => ({ meta: [{ title: translate({ en: 'Workouts', pl: 'Treningi' }) }] }),
  staticData: { navbar: { label: { en: 'Workouts', pl: 'Treningi' } } },
});

/** The URL keeps the viewed period, so coming back from a workout returns to the same place. */
function RouteComponent() {
  const { date } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <WorkoutsDashboardPage
      initialDate={validDate(date)}
      onDateChange={(next) =>
        void navigate({ replace: true, resetScroll: false, search: { date: next } })
      }
    />
  );
}

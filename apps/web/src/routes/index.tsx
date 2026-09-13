import { type } from 'arktype';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { HomeDashboard } from '@/pages/home/HomeDashboard';
import { HomePage } from '@/pages/home/HomePage';
import { acceptConnectionInvitationToken } from '@/pages/account/connections.api';
import { getHomeDashboard } from '@/pages/home/home.api';
import { todayLocalDate } from '@/lib/dateOnly';

export const Route = createFileRoute('/')({
  validateSearch: type({ 'invitation?': 'string' }),
  loaderDeps: () => ({ date: todayLocalDate() }),
  beforeLoad: async ({ context, search }) => {
    if (!search.invitation) return;

    if (!context.user) {
      // oxlint-disable-next-line typescript/only-throw-error -- Router control flow intentionally throws this object.
      throw redirect({ to: '/login', search: { redirect: `/?invitation=${search.invitation}` } });
    }

    await acceptConnectionInvitationToken({ data: { token: search.invitation } });
    // oxlint-disable-next-line typescript/only-throw-error -- Router control flow intentionally throws this object.
    throw redirect({ to: '/' });
  },
  loader: ({ context, deps }) =>
    context.user ? getHomeDashboard({ data: { date: deps.date } }) : null,
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = Route.useRouteContext();
  const dashboard = Route.useLoaderData();

  if (user && dashboard) return <HomeDashboard data={dashboard} />;

  return <HomePage />;
}

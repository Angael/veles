import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import clsx from 'clsx';
import { ChevronLeftIcon } from 'lucide-react';
import { Btn } from '@/components/btn/Btn';
import { NavMenu } from '@/components/nav-menu/NavMenu';
import { MobileNavMenu } from '@/components/nav-menu/MobileNavMenu';
import { clientEnv } from '@/lib/env/client';
import css from './AppFrame.module.css';

const ROUTE_LABEL_ITEMS = [
  { matchPrefix: '/weight', label: 'Weight' },
  { matchPrefix: '/recipes', label: 'Recipes' },
  { matchPrefix: '/calories', label: 'Calories' },
  { matchPrefix: '/account', label: 'Account' },
  { matchPrefix: '/login', label: 'Login' },
  { matchPrefix: '/signup', label: 'Sign Up' },
] as const;

export function AppFrame() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const routeLabel = ROUTE_LABEL_ITEMS.find((item) => pathname.startsWith(item.matchPrefix));

  return (
    <div className={css.page}>
      <div className={css.shell}>
        <header className={clsx(css.header, !routeLabel && css.headerDefaultBrand)}>
          <RouteLabel routeLabel={routeLabel?.label} />
          <NavMenu />
        </header>
        <Outlet />
        <MobileNavMenu />
      </div>
    </div>
  );
}

function RouteLabel({ routeLabel }: { routeLabel?: string }) {
  return (
    <div className={css.brand}>
      {routeLabel ? (
        <Btn
          aria-label='Back home'
          className={css.brandBackLink}
          icon={<ChevronLeftIcon aria-hidden='true' size={18} strokeWidth={2} />}
          iconOnly
          isLink
          render={<Link to='/' />}
          size='sm'
        />
      ) : null}
      {routeLabel ? <strong className={css.routeLabelTitle}>{routeLabel}</strong> : null}
    </div>
  );
}

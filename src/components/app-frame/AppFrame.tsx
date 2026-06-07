import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import { ChevronLeftIcon } from 'lucide-react';
import { Btn } from '@/components/btn/Btn';
import { NavMenu } from '@/components/nav-menu/NavMenu';
import { MobileNavMenu } from '@/components/nav-menu/MobileNavMenu';
import { clientEnv } from '@/lib/env/client';
import css from './AppFrame.module.css';

const ROUTE_BRAND_ITEMS = [
  { matchPrefix: '/weight', label: 'Weight' },
  { matchPrefix: '/recipes', label: 'Recipes' },
  { matchPrefix: '/calories', label: 'Calories' },
  { matchPrefix: '/account', label: 'Account' },
  { matchPrefix: '/login', label: 'Login' },
  { matchPrefix: '/signup', label: 'Sign Up' },
] as const;

export function AppFrame() {
  return (
    <div className={css.page}>
      <div className={css.shell}>
        <header className={css.header}>
          <AppBrand />
          <NavMenu />
        </header>
        <Outlet />
        <MobileNavMenu />
      </div>
    </div>
  );
}

function AppBrand() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const routeBrand = ROUTE_BRAND_ITEMS.find((item) => pathname.startsWith(item.matchPrefix));
  const label = routeBrand?.label ?? clientEnv.appName;

  return (
    <div className={css.brand}>
      {routeBrand ? (
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
      {routeBrand ? (
        <strong className={css.routeBrandTitle}>{label}</strong>
      ) : (
        <Link className={css.brandTitleLink} to='/'>
          <strong>{label}</strong>
        </Link>
      )}
    </div>
  );
}

import {
  Link,
  Outlet,
  useRouterState,
  type RegisteredRouter,
  type RouterState,
} from '@tanstack/react-router';
import clsx from 'clsx';
import { ChevronLeftIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { MobileNavbar } from '@/components/app/navbar/MobileNavbar';
import { Navbar } from '@/components/app/navbar/Navbar';
import type { SessionUser } from '@/lib/auth/session.api';
import type { NavbarTarget } from '@/lib/routing/staticRouteData';
import css from './AppFrame.module.css';

const routeMatchOptions = {
  select: (state: RouterState<RegisteredRouter['routeTree']>) => state.matches.at(-1),
};

export function AppFrame({
  children,
  user = null,
}: {
  children?: ReactNode;
  user?: SessionUser | null;
}) {
  const routeMatch = useRouterState(routeMatchOptions);
  const { layout, navbar } = routeMatch?.staticData ?? {};
  const isFocusLayout = layout === 'focus';

  return (
    <div className={css.page}>
      <div className={clsx(css.shell, isFocusLayout && 'focusShell')}>
        {!isFocusLayout && (
          <header className={css.header}>
            {navbar ? (
              <RouteLabel
                label={navbar.label}
                upTo={
                  typeof navbar.upTo === 'function'
                    ? navbar.upTo({ params: routeMatch?.params ?? {} })
                    : navbar.upTo
                }
              />
            ) : (
              <Link aria-label='Veles home' className={css.logoLink} to='/'>
                <img
                  alt='Veles'
                  className={css.logo}
                  height='90'
                  src='/veles-logo.webp'
                  width='270'
                />
              </Link>
            )}
            <Navbar user={user} />
          </header>
        )}
        {children === undefined ? <Outlet /> : children}
        {!isFocusLayout && <MobileNavbar user={user} />}
      </div>
    </div>
  );
}

function RouteLabel({ label, upTo }: { label: string; upTo?: NavbarTarget }) {
  return (
    <div className={css.brand}>
      {upTo ? (
        <Btn
          aria-label='Go up'
          className={css.brandBackLink}
          icon={<ChevronLeftIcon aria-hidden='true' size={18} strokeWidth={2} />}
          iconOnly
          isLink
          render={<Link {...upTo} />}
          size='sm'
          variant='outlineMain'
        />
      ) : null}
      <strong className={css.routeLabelTitle}>{label}</strong>
    </div>
  );
}

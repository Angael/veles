import {
  Link,
  Outlet,
  useRouterState,
  type RegisteredRouter,
  type RouterState,
} from '@tanstack/react-router';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { MobileNavbar } from '@/components/app/navbar/MobileNavbar';
import { Navbar } from '@/components/app/navbar/Navbar';
import type { SessionUser } from '@/lib/auth/session.api';
import css from './AppFrame.module.css';
import { RouteBackButton } from './RouteBackButton';
import { TaskHeader } from './TaskHeader';
import { VelesLogo } from './VelesLogo';

const routeMatchOptions = {
  select: (state: RouterState<RegisteredRouter['routeTree']>) => state.matches.at(-1)?.staticData,
};

export function AppFrame({
  children,
  user = null,
}: {
  children?: ReactNode;
  user?: SessionUser | null;
}) {
  const { layout, navbar } = useRouterState(routeMatchOptions) ?? {};

  return (
    <div className={css.page}>
      <div className={clsx(css.shell, layout && 'focusShell', layout === 'task' && css.taskShell)}>
        {layout === 'task' ? <TaskHeader label={navbar?.label} /> : null}
        {layout ? null : (
          <header className={css.header}>
            {navbar ? (
              <div className={css.brand}>
                <RouteBackButton />
                <strong className={css.routeLabelTitle}>{navbar.label}</strong>
              </div>
            ) : (
              <Link aria-label='Veles home' className={css.logoLink} to='/'>
                <VelesLogo />
              </Link>
            )}
            <Navbar user={user} />
          </header>
        )}
        {children === undefined ? <Outlet /> : children}
        {layout ? null : <MobileNavbar user={user} />}
      </div>
    </div>
  );
}

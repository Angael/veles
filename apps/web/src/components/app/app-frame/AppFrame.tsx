import {
  Link,
  Outlet,
  useRouterState,
  type RegisteredRouter,
  type RouterState,
} from '@tanstack/react-router';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { ClickSpark } from '@/components/app/click-spark/ClickSpark';
import { MobileNavbar } from '@/components/app/navbar/MobileNavbar';
import { Navbar } from '@/components/app/navbar/Navbar';
import { PageBackdrop } from '@/components/app/page-backdrop/PageBackdrop';
import { BlurText } from '@/components/ui/blur-text/BlurText';
import type { SessionUser } from '@/lib/auth/session.api';
import css from './AppFrame.module.css';
import { getPageAccent } from './pageAccent';
import { RouteBackButton } from './RouteBackButton';
import { TaskHeader } from './TaskHeader';
import { VelesLogo } from './VelesLogo';

const routeMatchOptions = {
  select: (state: RouterState<RegisteredRouter['routeTree']>) => state.matches.at(-1)?.staticData,
};

const pathnameOptions = {
  select: (state: RouterState<RegisteredRouter['routeTree']>) => state.location.pathname,
};

export function AppFrame({
  children,
  user = null,
}: {
  children?: ReactNode;
  user?: SessionUser | null;
}) {
  const { layout, navbar } = useRouterState(routeMatchOptions) ?? {};
  const accent = getPageAccent(useRouterState(pathnameOptions));

  return (
    <div className={css.page} data-accent={accent}>
      <PageBackdrop accent={accent} dimmed={Boolean(layout)} />
      <ClickSpark />
      <div className={clsx(css.shell, layout && 'focusShell', layout === 'task' && css.taskShell)}>
        {layout === 'task' ? <TaskHeader label={navbar?.label} /> : null}
        {layout ? null : (
          <header className={css.header}>
            {navbar ? (
              <div className={css.brand}>
                <RouteBackButton />
                <strong className={css.routeLabelTitle} key={navbar.label}>
                  <BlurText splitBy='letters' stepMs={35} text={navbar.label} />
                </strong>
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

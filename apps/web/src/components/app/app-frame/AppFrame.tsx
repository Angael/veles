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
import { useI18n } from '@/lib/i18n/I18nProvider';
import css from './AppFrame.module.css';
import { RouteBackButton } from './RouteBackButton';
import { TaskHeader } from './TaskHeader';
import { VelesLogo } from './VelesLogo';

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
  const { t } = useI18n();
  const match = useRouterState(routeMatchOptions);
  const { layout, navbar } = match?.staticData ?? {};
  // Keyed by route, so a hook label never runs in place of another route's hook.
  const label =
    typeof navbar?.label === 'function' ? (
      <HookLabel key={match?.routeId} useLabel={navbar.label} />
    ) : (
      navbar && t(navbar.label)
    );

  return (
    <div className={css.page}>
      <div className={clsx(css.shell, layout && 'focusShell', layout === 'task' && css.taskShell)}>
        {layout === 'task' ? (
          <TaskHeader actions={navbar?.Actions ? <navbar.Actions /> : null} title={label} />
        ) : null}
        {layout ? null : (
          <header className={css.header}>
            {navbar ? (
              <div className={css.brand}>
                <RouteBackButton />
                <strong className={css.routeLabelTitle}>{label}</strong>
              </div>
            ) : (
              <Link
                aria-label={t({ en: 'Veles home', pl: 'Strona główna Veles' })}
                className={css.logoLink}
                to='/'
              >
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

function HookLabel({ useLabel }: { useLabel: () => string }) {
  return useLabel();
}

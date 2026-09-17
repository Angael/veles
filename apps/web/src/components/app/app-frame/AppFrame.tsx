import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import clsx from 'clsx';
import { ChevronLeftIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { MobileNavbar } from '@/components/app/navbar/MobileNavbar';
import { Navbar } from '@/components/app/navbar/Navbar';
import type { SessionUser } from '@/lib/auth/session.api';
import type { NavbarTarget } from '@/lib/routing/staticRouteData';
import css from './AppFrame.module.css';

type RouteTarget =
  | NavbarTarget
  | ((match: { params: Record<string, string | undefined> }) => NavbarTarget);

export function AppFrame({
  children,
  user = null,
}: {
  children?: ReactNode;
  user?: SessionUser | null;
}) {
  const routeFrame = useRouterState({
    select: (state) => {
      const match = state.matches.at(-1);

      if (!match) {
        return undefined;
      }

      const resolveTarget = (target: RouteTarget) =>
        typeof target === 'function' ? target({ params: match.params }) : target;

      if (match.staticData.layout === 'focus' && match.staticData.backTo) {
        return { backTo: resolveTarget(match.staticData.backTo), layout: 'focus' as const };
      }

      const navbarData = match.staticData.navbar;

      if (!navbarData) {
        return undefined;
      }

      return {
        layout: 'app' as const,
        label: navbarData.label,
        upTo: navbarData.upTo ? resolveTarget(navbarData.upTo) : undefined,
      };
    },
  });
  const isFocusLayout = routeFrame?.layout === 'focus';

  return (
    <div className={css.page}>
      <div className={clsx(css.shell, isFocusLayout && css.focusShell)}>
        {isFocusLayout ? (
          <header className={css.focusHeader}>
            <FocusBackLink backTo={routeFrame.backTo} />
          </header>
        ) : (
          <header className={css.header}>
            {routeFrame?.layout === 'app' ? (
              <RouteLabel label={routeFrame.label} upTo={routeFrame.upTo} />
            ) : (
              <div />
            )}
            <Navbar user={user} />
          </header>
        )}
        {children === undefined ? <Outlet /> : children}
        {!isFocusLayout ? <MobileNavbar user={user} /> : null}
      </div>
    </div>
  );
}

function FocusBackLink({ backTo }: { backTo: NavbarTarget }) {
  return (
    <Btn
      aria-label='Back'
      icon={<ChevronLeftIcon aria-hidden='true' size={18} strokeWidth={2} />}
      isLink
      render={<Link {...backTo} />}
      size='sm'
      variant='ghost'
    >
      Back
    </Btn>
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

import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import clsx from 'clsx';
import { ChevronLeftIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Btn } from '@/components/btn/Btn';
import { NavMenu } from '@/components/nav-menu/NavMenu';
import { MobileNavMenu } from '@/components/nav-menu/MobileNavMenu';
import type { NavbarTarget } from '@/lib/routing/staticRouteData';
import css from './AppFrame.module.css';

export function AppFrame({ children }: { children?: ReactNode }) {
  const navbar = useRouterState({
    select: (state) => {
      const match = state.matches.at(-1);
      const navbarData = match?.staticData.navbar;

      if (!match || !navbarData) {
        return undefined;
      }

      return {
        label: navbarData.label,
        upTo:
          typeof navbarData.upTo === 'function'
            ? navbarData.upTo({ params: match.params })
            : navbarData.upTo,
      };
    },
  });

  return (
    <div className={css.page}>
      <div className={css.shell}>
        <header className={clsx(css.header, !navbar && css.headerDefaultBrand)}>
          {navbar ? <RouteLabel label={navbar.label} upTo={navbar.upTo} /> : <div />}
          <NavMenu />
        </header>
        {children === undefined ? <Outlet /> : children}
        <MobileNavMenu />
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

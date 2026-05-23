import { NavigationMenu } from '@base-ui/react/navigation-menu';
import { Link, useRouterState } from '@tanstack/react-router';
import css from './NavMenu.module.css';

const links = [
  { to: '/', label: 'Home' },
  { to: '/login', label: 'Login' },
  { to: '/signup', label: 'Sign Up' },
  { to: '/demo/start/ssr', label: 'SSR' },
  { to: '/demo/start/ssr/spa-mode', label: 'SPA Mode' },
  { to: '/demo/start/ssr/full-ssr', label: 'Full SSR' },
  { to: '/demo/start/ssr/data-only', label: 'Data Only' },
  { to: '/demo/start/server-funcs', label: 'Server Functions' },
  { to: '/demo/start/api-request', label: 'API Route' },
  { to: '/demo/tanstack-query', label: 'TanStack Query' },
] as const;

export function NavMenu() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <NavigationMenu.Root className={css.navRoot}>
      <NavigationMenu.List className={css.navList}>
        {links.map((link) => {
          const active = pathname === link.to;

          return (
            <NavigationMenu.Item key={link.to}>
              <NavigationMenu.Link
                active={active}
                className={active ? css.navLinkActive : css.navLink}
                render={<Link className={css.navLinkAnchor} to={link.to as never} />}
              >
                {link.label}
              </NavigationMenu.Link>
            </NavigationMenu.Item>
          );
        })}
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}

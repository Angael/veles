import { NavigationMenu } from '@base-ui/react/navigation-menu';
import type { ComponentProps } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import css from './NavMenu.module.css';

const menuGroups = [
  {
    label: 'Demo',
    matches: ['/demo'],
    links: [
      {
        to: '/demo/start/ssr',
        label: 'SSR',
        description: 'TanStack Start SSR entry point.',
      },
      {
        to: '/demo/start/ssr/spa-mode',
        label: 'SPA Mode',
        description: 'SSR route configured for SPA rendering.',
      },
      {
        to: '/demo/start/ssr/full-ssr',
        label: 'Full SSR',
        description: 'Server-rendered page with full HTML output.',
      },
      {
        to: '/demo/start/ssr/data-only',
        label: 'Data Only',
        description: 'Loader-driven data rendering example.',
      },
      {
        to: '/demo/start/server-funcs',
        label: 'Server Functions',
        description: 'Calls TanStack Start server functions.',
      },
      {
        to: '/demo/start/api-request',
        label: 'API Route',
        description: 'Hits a server API route from the client.',
      },
      {
        to: '/demo/tanstack-query',
        label: 'TanStack Query',
        description: 'Query caching and async state demo.',
      },
    ],
  },
  {
    label: 'Account',
    matches: ['/login', '/signup'],
    links: [
      {
        to: '/login',
        label: 'Login',
        description: 'Sign in to an existing account.',
      },
      {
        to: '/signup',
        label: 'Sign Up',
        description: 'Create an account and get started.',
      },
    ],
  },
] as const;

export function NavMenu() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <NavigationMenu.Root className={css.navRoot}>
      <NavigationMenu.List className={css.navList}>
        {menuGroups.map((group) => {
          const active = group.matches.some((prefix) => pathname.startsWith(prefix));

          return (
            <NavigationMenu.Item key={group.label}>
              <NavigationMenu.Trigger className={active ? css.navTriggerActive : css.navTrigger}>
                {group.label}
                <NavigationMenu.Icon className={css.navIcon}>
                  <CaretDownIcon />
                </NavigationMenu.Icon>
              </NavigationMenu.Trigger>

              <NavigationMenu.Content className={css.navContent}>
                <ul className={css.navLinkList}>
                  {group.links.map((link) => {
                    const linkActive = pathname === link.to;

                    return (
                      <li key={link.to}>
                        <MenuLink
                          active={linkActive}
                          className={linkActive ? css.navCardActive : css.navCard}
                          to={link.to}
                        >
                          <h3 className={css.navCardTitle}>{link.label}</h3>
                          <p className={css.navCardDescription}>{link.description}</p>
                        </MenuLink>
                      </li>
                    );
                  })}
                </ul>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          );
        })}
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner
          className={css.navPositioner}
          sideOffset={10}
          collisionPadding={{ top: 8, right: 16, bottom: 8, left: 16 }}
          collisionAvoidance={{ side: 'none' }}
        >
          <NavigationMenu.Popup className={css.navPopup}>
            <NavigationMenu.Arrow className={css.navArrow} />
            <NavigationMenu.Viewport className={css.navViewport} />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}

function MenuLink({ to, ...props }: MenuLinkProps) {
  return <NavigationMenu.Link render={<Link to={to as never} />} {...props} />;
}

function CaretDownIcon(props: ComponentProps<'svg'>) {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='currentColor'
      aria-hidden='true'
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d='M12 6H4l4 4.5z' />
    </svg>
  );
}

type MenuLinkProps = Omit<NavigationMenu.Link.Props, 'render'> & {
  to: string;
};

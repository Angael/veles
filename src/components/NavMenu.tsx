import { Avatar } from '@base-ui/react/avatar';
import { NavigationMenu } from '@base-ui/react/navigation-menu';
import { useState, type ComponentProps } from 'react';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { signOut, useSession } from '@/lib/auth/client';
import css from './NavMenu.module.css';

const menuGroups = [
  {
    label: 'Trackers',
    matches: ['/weight'],
    links: [
      {
        to: '/weight',
        label: 'Weight',
        description: 'Mock dashboard for body weight logging and trend review.',
      },
    ],
  },
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
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const { data: session } = useSession();
  const user = session?.user;
  const [logoutBusy, setLogoutBusy] = useState(false);
  const accountInitials = getInitials(user?.name ?? user?.email ?? 'Account');
  const accountLinks = user
    ? [
        {
          type: 'action' as const,
          label: 'Logout',
          description: 'Sign out of the current account.',
        },
      ]
    : (menuGroups.find((group) => group.label === 'Account')?.links ?? []);

  async function handleLogout() {
    if (logoutBusy) {
      return;
    }

    setLogoutBusy(true);

    const result = await signOut();

    setLogoutBusy(false);

    if (result.error) {
      return;
    }

    navigate({ to: '/login' as never });
  }

  return (
    <NavigationMenu.Root className={css.navRoot}>
      <NavigationMenu.List className={css.navList}>
        {menuGroups.map((group) => {
          const active = group.matches.some((prefix) => pathname.startsWith(prefix));

          return (
            <NavigationMenu.Item key={group.label}>
              <NavigationMenu.Trigger className={active ? css.navTriggerActive : css.navTrigger}>
                {group.label === 'Account' ? (
                  <Avatar.Root className={css.accountAvatar}>
                    {user?.image ? (
                      <Avatar.Image
                        src={user.image}
                        alt={user.name ?? user.email ?? 'Account avatar'}
                        className={css.accountAvatarImage}
                      />
                    ) : null}
                    <Avatar.Fallback className={css.accountAvatarFallback}>
                      {accountInitials}
                    </Avatar.Fallback>
                  </Avatar.Root>
                ) : null}
                {group.label}
                <NavigationMenu.Icon className={css.navIcon}>
                  <CaretDownIcon />
                </NavigationMenu.Icon>
              </NavigationMenu.Trigger>

              <NavigationMenu.Content className={css.navContent}>
                <ul className={css.navLinkList}>
                  {(group.label === 'Account' ? accountLinks : group.links).map((link) => {
                    if ('type' in link) {
                      return (
                        <li key={link.label}>
                          <button
                            className={css.navCard}
                            disabled={logoutBusy}
                            onClick={handleLogout}
                            type='button'
                          >
                            <h3 className={css.navCardTitle}>
                              {logoutBusy ? 'Logging out...' : link.label}
                            </h3>
                            <p className={css.navCardDescription}>{link.description}</p>
                          </button>
                        </li>
                      );
                    }

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

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  const compact = parts[0] ?? value.trim();

  if (!compact) {
    return 'A';
  }

  if (compact.includes('@')) {
    return compact.slice(0, 2).toUpperCase();
  }

  return compact.slice(0, 2).toUpperCase();
}

type MenuLinkProps = Omit<NavigationMenu.Link.Props, 'render'> & {
  to: string;
};

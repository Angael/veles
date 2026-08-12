import { Avatar } from '@base-ui/react/avatar';
import { NavigationMenu } from '@base-ui/react/navigation-menu';
import { Link, useRouterState } from '@tanstack/react-router';
import { ChevronDownIcon, UserIcon } from 'lucide-react';
import { useState } from 'react';
import type { SessionUser } from '@/lib/auth/session.api';
import css from './NavMenu.module.css';
import { DESKTOP_NAV_MENU_GROUPS } from './useNavMenuGroups';

export function NavMenu({ user }: { user: SessionUser | null }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const [value, setValue] = useState<string | null>(null);
  const accountName = user?.name ?? user?.email;
  const accountNameParts = accountName?.trim().split(/\s+/) ?? [];
  const accountInitials = `${accountNameParts[0]?.[0] ?? ''}${
    accountNameParts.length > 1 ? (accountNameParts.at(-1)?.[0] ?? '') : ''
  }`.toUpperCase();

  return (
    <div className={css.navRoot}>
      {user ? (
        <NavigationMenu.Root className={css.desktopMenu} onValueChange={setValue} value={value}>
          <NavigationMenu.List className={css.navList}>
            {DESKTOP_NAV_MENU_GROUPS.map((group) => {
              const active = group.matchPrefixes.some((prefix) => pathname.startsWith(prefix));

              return (
                <NavigationMenu.Item key={group.key} value={group.key}>
                  <NavigationMenu.Trigger
                    className={active ? css.navTriggerActive : css.navTrigger}
                  >
                    {group.label}
                    <NavigationMenu.Icon className={css.navIcon}>
                      <ChevronDownIcon
                        aria-hidden='true'
                        size={16}
                        strokeWidth={1.75}
                        style={{ display: 'block' }}
                      />
                    </NavigationMenu.Icon>
                  </NavigationMenu.Trigger>

                  <NavigationMenu.Content className={css.navContent}>
                    <ul className={css.navLinkList}>
                      {group.items.map((item) => {
                        if (!item.link) {
                          return (
                            <li key={item.key}>
                              <button
                                className={css.navCard}
                                disabled={item.disabled}
                                onClick={() => {
                                  setValue(null);
                                  void item.onClick?.();
                                }}
                                type='button'
                              >
                                <h3 className={css.navCardTitle}>{item.label}</h3>
                                <p className={css.navCardDescription}>{item.description}</p>
                              </button>
                            </li>
                          );
                        }

                        const linkActive = pathname === item.link;

                        return (
                          <li key={item.key}>
                            <MenuLink
                              active={linkActive}
                              className={linkActive ? css.navCardActive : css.navCard}
                              onClick={() => {
                                setValue(null);
                                void item.onClick?.();
                              }}
                              to={item.link}
                            >
                              <h3 className={css.navCardTitle}>{item.label}</h3>
                              <p className={css.navCardDescription}>{item.description}</p>
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
      ) : null}

      <Link
        aria-label='Account'
        className={pathname.startsWith('/account') ? css.accountLinkActive : css.accountLink}
        to='/account'
      >
        <Avatar.Root aria-hidden='true' className={css.accountAvatar}>
          {user?.image ? (
            <Avatar.Image alt='' className={css.accountAvatarImage} src={user.image} />
          ) : null}
          <Avatar.Fallback className={css.accountAvatarFallback}>
            {accountInitials || <UserIcon aria-hidden='true' size={16} strokeWidth={1.9} />}
          </Avatar.Fallback>
        </Avatar.Root>
        <span className={css.accountLabel}>Account</span>
      </Link>
    </div>
  );
}

function MenuLink({ to, ...props }: MenuLinkProps) {
  return <NavigationMenu.Link render={<Link to={to} />} {...props} />;
}

type MenuLinkProps = Omit<NavigationMenu.Link.Props, 'render'> & {
  to: string;
};

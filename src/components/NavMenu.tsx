import { NavigationMenu } from '@base-ui/react/navigation-menu';
import type { ComponentProps } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import css from './NavMenu.module.css';
import { useNavMenuGroups } from './useNavMenuGroups';

export function NavMenu() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const { groups } = useNavMenuGroups();

  return (
    <NavigationMenu.Root className={css.navRoot}>
      <NavigationMenu.List className={css.navList}>
        {groups.map((group) => {
          if (group.shouldRender === false) {
            return null;
          }

          const active = group.matchPrefixes.some((prefix) => pathname.startsWith(prefix));
          const visibleItems = group.items.filter((item) => item.shouldRender !== false);

          if (visibleItems.length === 0) {
            return null;
          }

          return (
            <NavigationMenu.Item key={group.key}>
              <NavigationMenu.Trigger className={active ? css.navTriggerActive : css.navTrigger}>
                {group.label}
                <NavigationMenu.Icon className={css.navIcon}>
                  <CaretDownIcon />
                </NavigationMenu.Icon>
              </NavigationMenu.Trigger>

              <NavigationMenu.Content className={css.navContent}>
                <ul className={css.navLinkList}>
                  {visibleItems.map((item) => {
                    if (!item.link) {
                      return (
                        <li key={item.key}>
                          <button
                            className={css.navCard}
                            disabled={item.disabled}
                            onClick={() => void item.onClick?.()}
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
                          onClick={item.onClick}
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

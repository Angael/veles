import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Link, useRouterState } from '@tanstack/react-router';
import type { SessionUser } from '@/lib/auth/session.api';
import css from './MobileNavbar.module.css';
import { NAVBAR_ITEMS } from './navbarItems';

export function MobileNavbar({ user }: { user: SessionUser | null }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const items = user ? NAVBAR_ITEMS : [];
  const activeValue = items.find((item) =>
    item.matchPrefixes.some((prefix) => pathname.startsWith(prefix)),
  )?.key;

  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label='Primary mobile navigation' className={css.wrapper}>
      <ToggleGroup
        aria-label='Primary mobile navigation'
        className={css.group}
        value={activeValue ? [activeValue] : []}
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Toggle
              key={item.key}
              aria-label={item.label}
              className={css.item}
              nativeButton={false}
              render={<Link to={item.link} />}
              value={item.key}
            >
              <Icon aria-hidden='true' size={20} strokeWidth={1.9} />
            </Toggle>
          );
        })}
      </ToggleGroup>
    </nav>
  );
}

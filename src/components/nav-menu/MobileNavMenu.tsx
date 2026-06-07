import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Link, useRouterState } from '@tanstack/react-router';
import { BookOpenIcon, FlameIcon, LogInIcon, ScaleIcon, UserIcon } from 'lucide-react';
import css from './MobileNavMenu.module.css';
import { MOBILE_NAV_ITEMS, useNavMenuGroups } from './useNavMenuGroups';

const itemIcons = {
  account: UserIcon,
  calories: FlameIcon,
  login: LogInIcon,
  recipes: BookOpenIcon,
  weight: ScaleIcon,
} as const;

export function MobileNavMenu() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const { mobileAccountItem } = useNavMenuGroups();
  const items = [...MOBILE_NAV_ITEMS, mobileAccountItem];
  const activeValue = items.find((item) =>
    item.matchPrefixes.some((prefix) => pathname.startsWith(prefix)),
  )?.key;

  return (
    <nav aria-label='Primary mobile navigation' className={css.wrapper}>
      <ToggleGroup
        aria-label='Primary mobile navigation'
        className={css.group}
        value={activeValue ? [activeValue] : []}
      >
        {items.map((item) => {
          const Icon = item.key === 'account' ? itemIcons.account : itemIcons[item.key];

          return (
            <Toggle
              key={item.key}
              aria-label={item.label}
              className={css.item}
              render={<Link to={item.link} />}
              value={item.key}
            >
              {item.key === 'account' && item.user?.image ? (
                <span
                  aria-hidden='true'
                  className={css.avatar}
                  style={{ backgroundImage: `url(${item.user.image})` }}
                />
              ) : (
                <Icon aria-hidden='true' size={20} strokeWidth={1.9} />
              )}
            </Toggle>
          );
        })}
      </ToggleGroup>
    </nav>
  );
}

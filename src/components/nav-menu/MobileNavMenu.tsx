import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Link, useRouterState } from '@tanstack/react-router';
import clsx from 'clsx';
import {
  BookOpenIcon,
  FlameIcon,
  LogInIcon,
  NotebookPenIcon,
  ScaleIcon,
  UserIcon,
} from 'lucide-react';
import css from './MobileNavMenu.module.css';
import { useMobileNavItems } from './useNavMenuGroups';

const itemIcons = {
  account: UserIcon,
  calories: FlameIcon,
  diary: NotebookPenIcon,
  login: LogInIcon,
  recipes: BookOpenIcon,
  weight: ScaleIcon,
} as const;

export function MobileNavMenu() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const items = useMobileNavItems();
  const activeValue = items.find((item) =>
    item.matchPrefixes.some((prefix) => pathname.startsWith(prefix)),
  )?.key;

  return (
    <nav aria-label='Primary mobile navigation' className={css.wrapper}>
      <ToggleGroup
        aria-label='Primary mobile navigation'
        className={clsx(css.group, items.length === 1 && css.groupCompact)}
        value={activeValue ? [activeValue] : []}
      >
        {items.map((item) => {
          const Icon = item.key === 'account' ? itemIcons.account : itemIcons[item.key];

          return (
            <Toggle
              key={item.key}
              aria-label={item.label}
              className={css.item}
              nativeButton={false}
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

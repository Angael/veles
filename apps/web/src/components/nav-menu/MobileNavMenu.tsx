import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import clsx from 'clsx';
import {
  BookOpenIcon,
  FlameIcon,
  LogInIcon,
  NotebookPenIcon,
  ListTodoIcon,
  ScaleIcon,
  UserIcon,
} from 'lucide-react';
import type { SessionUser } from '@/lib/auth/session.api';
import css from './MobileNavMenu.module.css';
import { useMobileNavItems } from './useNavMenuGroups';

const itemIcons = {
  account: UserIcon,
  calories: FlameIcon,
  diary: NotebookPenIcon,
  login: LogInIcon,
  recipes: BookOpenIcon,
  todos: ListTodoIcon,
  weight: ScaleIcon,
} as const;

export function MobileNavMenu({ user }: { user: SessionUser | null }) {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const items = useMobileNavItems(user);
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
              render={
                <Link
                  onPointerDown={(event) => {
                    if (
                      event.button !== 0 ||
                      event.metaKey ||
                      event.ctrlKey ||
                      event.shiftKey ||
                      event.altKey
                    ) {
                      return;
                    }

                    event.preventDefault();
                    void navigate({ to: item.link });
                  }}
                  to={item.link}
                />
              }
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

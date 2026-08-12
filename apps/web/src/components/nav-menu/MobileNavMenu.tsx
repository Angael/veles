import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { BookOpenIcon, FlameIcon, NotebookPenIcon, ListTodoIcon, ScaleIcon } from 'lucide-react';
import type { SessionUser } from '@/lib/auth/session.api';
import css from './MobileNavMenu.module.css';
import { MOBILE_NAV_ITEMS } from './useNavMenuGroups';

const itemIcons = {
  calories: FlameIcon,
  diary: NotebookPenIcon,
  recipes: BookOpenIcon,
  todos: ListTodoIcon,
  weight: ScaleIcon,
} as const;

export function MobileNavMenu({ user }: { user: SessionUser | null }) {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const items = user ? MOBILE_NAV_ITEMS : [];
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
          const Icon = itemIcons[item.key];

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
              <Icon aria-hidden='true' size={20} strokeWidth={1.9} />
            </Toggle>
          );
        })}
      </ToggleGroup>
    </nav>
  );
}

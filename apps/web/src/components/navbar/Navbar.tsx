import { Avatar } from '@base-ui/react/avatar';
import { useRouterState } from '@tanstack/react-router';
import { UserIcon } from 'lucide-react';
import { useMemo } from 'react';
import { PillBtn } from '@/components/pill-btn/PillBtn';
import type { SessionUser } from '@/lib/auth/session.api';
import { getInitials } from '@/lib/getInitials';
import css from './Navbar.module.css';
import { NAVBAR_ITEMS } from './navbarItems';

export function Navbar({ user }: { user: SessionUser | null }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const accountInitials = useMemo(
    () => getInitials(user?.name ?? user?.email),
    [user?.name, user?.email],
  );

  return (
    <nav aria-label='Primary navigation' className={css.navbar}>
      {user ? (
        <ul className={css.trackerList}>
          {NAVBAR_ITEMS.map((item) => {
            const active = item.matchPrefixes.some((prefix) => pathname.startsWith(prefix));
            const Icon = item.icon;

            return (
              <li key={item.key}>
                <PillBtn
                  active={active}
                  collapseLabelAt='tablet'
                  label={item.label}
                  to={item.link}
                  visual={<Icon size={16} strokeWidth={1.9} />}
                />
              </li>
            );
          })}
        </ul>
      ) : null}

      <PillBtn
        active={pathname.startsWith('/account')}
        collapseLabelAt='phone'
        label='Account'
        to='/account'
        visual={
          <Avatar.Root className={css.accountAvatar}>
            {user?.image ? (
              <Avatar.Image alt='' className={css.accountAvatarImage} src={user.image} />
            ) : null}
            <Avatar.Fallback className={css.accountAvatarFallback}>
              {accountInitials || <UserIcon size={16} strokeWidth={1.9} />}
            </Avatar.Fallback>
          </Avatar.Root>
        }
      />
    </nav>
  );
}

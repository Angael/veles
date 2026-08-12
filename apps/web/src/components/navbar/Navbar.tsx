import { Avatar } from '@base-ui/react/avatar';
import { Link, useRouterState } from '@tanstack/react-router';
import { UserIcon } from 'lucide-react';
import { useMemo } from 'react';
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
                <Link
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                  className={active ? css.navLinkActive : css.navLink}
                  to={item.link}
                >
                  <Icon aria-hidden='true' size={16} strokeWidth={1.9} />
                  <span className={css.navLabel}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
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
    </nav>
  );
}

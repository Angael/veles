import { Avatar } from '@base-ui/react/avatar';
import { useNavigate } from '@tanstack/react-router';
import { type ReactNode, useState } from 'react';
import { signOut, useSession } from '@/lib/auth/client';
import css from './NavMenu.module.css';

export interface NavMenuGroup {
  key: string;
  label: ReactNode;
  matchPrefixes: string[];
  shouldRender?: boolean;
  items: NavMenuItem[];
}

export interface NavMenuItem {
  key: string;
  label: ReactNode;
  description: string;
  link?: string;
  onClick?: () => void | Promise<void>;
  shouldRender?: boolean;
  disabled?: boolean;
}

export function useNavMenuGroups() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const user = session?.user;
  const [logoutBusy, setLogoutBusy] = useState(false);
  const accountInitials = getInitials(user?.name ?? user?.email ?? 'Account');

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

    navigate({ to: '/login' });
  }

  const accountLabel = (
    <>
      <Avatar.Root className={css.accountAvatar}>
        {user?.image ? (
          <Avatar.Image
            src={user.image}
            alt={user.name ?? user.email ?? 'Account avatar'}
            className={css.accountAvatarImage}
          />
        ) : null}
        <Avatar.Fallback className={css.accountAvatarFallback}>{accountInitials}</Avatar.Fallback>
      </Avatar.Root>
      Account
    </>
  );

  const groups: NavMenuGroup[] = [
    {
      key: 'trackers',
      label: 'Trackers',
      matchPrefixes: ['/weight', '/recipes'],
      items: [
        {
          key: 'weight',
          link: '/weight',
          label: 'Weight',
          description: 'Mock dashboard for body weight logging and trend review.',
        },
        {
          key: 'recipes',
          link: '/recipes',
          label: 'Recipes',
          description: 'Recipe notes and cooking references.',
        },
      ],
    },
    {
      key: 'account',
      label: accountLabel,
      matchPrefixes: ['/login', '/signup'],
      items: [
        {
          key: 'login',
          link: '/login',
          label: 'Login',
          description: 'Sign in to an existing account.',
          shouldRender: !user,
        },
        {
          key: 'signup',
          link: '/signup',
          label: 'Sign Up',
          description: 'Create an account and get started.',
          shouldRender: !user,
        },
        {
          key: 'logout',
          label: logoutBusy ? 'Logging out...' : 'Logout',
          description: 'Sign out of the current account.',
          onClick: handleLogout,
          shouldRender: Boolean(user),
          disabled: logoutBusy,
        },
      ],
    },
  ];

  return { groups };
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

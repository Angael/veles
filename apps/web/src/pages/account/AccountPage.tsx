import { Avatar } from '@base-ui/react/avatar';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { LogOutIcon, UserMinusIcon, UserPlusIcon, UsersIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import { signOut } from '@/lib/auth/client';
import type { SessionUser } from '@/lib/auth/session.api';
import { getInitials } from '@/lib/getInitials';
import css from './AccountPage.module.css';

interface AccountPageProps {
  user: SessionUser;
}

interface MockFriend {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
}

const MOCK_USERS: MockFriend[] = [
  { id: 'friend-1', name: 'Maya Chen', email: 'maya@example.com', initials: 'MC', color: 'cyan' },
  {
    id: 'friend-2',
    name: 'Theo Martin',
    email: 'theo@example.com',
    initials: 'TM',
    color: 'violet',
  },
  { id: 'friend-3', name: 'Nora Silva', email: 'nora@example.com', initials: 'NS', color: 'amber' },
];

export function AccountPage({ user }: AccountPageProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const [friendIds, setFriendIds] = useState(() => new Set(['friend-1', 'friend-3']));
  const [logoutBusy, setLogoutBusy] = useState(false);
  const accountInitials = useMemo(() => getInitials(user.name) || 'A', [user.name]);

  async function handleLogout() {
    setLogoutBusy(true);
    const result = await signOut();

    if (result.error) {
      setLogoutBusy(false);
      return;
    }

    await router.invalidate();
    await navigate({ to: '/login' });
  }

  function toggleFriend(id: string) {
    setFriendIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  return (
    <main className={css.page}>
      <Card as='section' className={css.profileCard} variant='primary'>
        <Avatar.Root className={css.profileAvatar}>
          {user.image ? <Avatar.Image alt='' className={css.avatarImage} src={user.image} /> : null}
          <Avatar.Fallback className={css.profileFallback}>{accountInitials}</Avatar.Fallback>
        </Avatar.Root>
        <div className={css.profileInfo}>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
          <span>Signed in account</span>
        </div>
        <Btn
          icon={<LogOutIcon aria-hidden='true' />}
          loading={logoutBusy}
          onClick={handleLogout}
          size='sm'
          variant='outlineDanger'
        >
          Log out
        </Btn>
      </Card>

      <Card as='section' className={css.friendsCard}>
        <header className={css.sectionHeader}>
          <div>
            <h2>Friends</h2>
            <p>Choose who you want to connect with.</p>
          </div>
          <span className={css.friendCount}>
            <UsersIcon aria-hidden='true' />
            {friendIds.size} {friendIds.size === 1 ? 'friend' : 'friends'}
          </span>
        </header>

        <ul className={css.friendList}>
          {MOCK_USERS.map((friend) => {
            const isFriend = friendIds.has(friend.id);

            return (
              <li className={css.friendRow} key={friend.id}>
                <Avatar.Root className={css.friendAvatar}>
                  <Avatar.Fallback className={css.friendFallback} data-color={friend.color}>
                    {friend.initials}
                  </Avatar.Fallback>
                </Avatar.Root>
                <div className={css.friendInfo}>
                  <strong>{friend.name}</strong>
                  <span>{friend.email}</span>
                </div>
                <Btn
                  aria-label={`${isFriend ? 'Remove' : 'Add'} ${friend.name}`}
                  icon={
                    isFriend ? (
                      <UserMinusIcon aria-hidden='true' />
                    ) : (
                      <UserPlusIcon aria-hidden='true' />
                    )
                  }
                  onClick={() => toggleFriend(friend.id)}
                  size='sm'
                  variant={isFriend ? 'ghostDanger' : 'outlineMain'}
                >
                  {isFriend ? 'Remove' : 'Add friend'}
                </Btn>
              </li>
            );
          })}
        </ul>

        <p className={css.mockNote}>Friend changes are a preview and are not saved yet.</p>
      </Card>
    </main>
  );
}

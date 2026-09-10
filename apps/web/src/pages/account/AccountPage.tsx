import { Avatar } from '@base-ui/react/avatar';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { LogOutIcon } from 'lucide-react';
import { useMemo } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import type { SessionUser } from '@/lib/auth/session.api';
import { getInitials } from '@/lib/getInitials';
import { useSignOutMutation } from './account.query';
import { FriendsCard } from './FriendsCard';
import css from './AccountPage.module.css';

interface AccountPageProps {
  invitation?: string;
  user: SessionUser;
}

export function AccountPage({ invitation, user }: AccountPageProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const accountInitials = useMemo(() => getInitials(user.name) || 'A', [user.name]);
  const signOutMutation = useSignOutMutation();

  async function handleLogout() {
    const result = await signOutMutation.mutateAsync();
    if (!result.error) {
      await router.invalidate();
      await navigate({ to: '/' });
    }
  }

  return (
    <main className={css.page}>
      <Card as='section' className={css.profileCard} data-appear variant='primary'>
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
          loading={signOutMutation.isPending}
          onClick={() => void handleLogout().catch(() => undefined)}
          size='sm'
          variant='outlineDanger'
        >
          Log out
        </Btn>
      </Card>

      <FriendsCard invitation={invitation} />
    </main>
  );
}

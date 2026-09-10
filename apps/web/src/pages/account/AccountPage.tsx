import { Avatar } from '@base-ui/react/avatar';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { CheckIcon, LogOutIcon, MailIcon, UserMinusIcon, UsersIcon, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { Label } from '@/components/ui/label/Label';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import type { SessionUser } from '@/lib/auth/session.api';
import { getInitials } from '@/lib/getInitials';
import {
  useAcceptConnectionInvitationMutation,
  useConnectionsQuery,
  useDisconnectUserMutation,
  useRemoveConnectionInvitationMutation,
  useSendConnectionInvitationMutation,
  useSignOutMutation,
} from './account.query';
import css from './AccountPage.module.css';

interface AccountPageProps {
  invitation?: string;
  user: SessionUser;
}

export function AccountPage({ invitation, user }: AccountPageProps) {
  const navigate = useNavigate();
  const router = useRouter();
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);
  const accountInitials = useMemo(() => getInitials(user.name) || 'A', [user.name]);
  const connectionsQuery = useConnectionsQuery();
  const signOutMutation = useSignOutMutation();
  const sendInvitationMutation = useSendConnectionInvitationMutation();
  const acceptInvitationMutation = useAcceptConnectionInvitationMutation();
  const removeInvitationMutation = useRemoveConnectionInvitationMutation();
  const disconnectMutation = useDisconnectUserMutation();
  const data = connectionsQuery.data;

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

      <Card as='section' className={css.friendsCard} data-appear='1'>
        <header className={css.sectionHeader}>
          <div>
            <h2>Connections</h2>
            <p>Invite people you trust. Sharing stays off until you enable it per item.</p>
          </div>
          <span className={css.friendCount}>
            <UsersIcon aria-hidden='true' />
            {data?.connections.length ?? 0}
          </span>
        </header>

        {invitation ? (
          <p className={css.invitationNotice}>
            Sign-in succeeded. Review your pending invitation below before connecting.
          </p>
        ) : null}

        <TypedForm
          className={css.inviteForm}
          onSubmit={async (form) => {
            setInviteFeedback(null);
            try {
              const result = await sendInvitationMutation.mutateAsync(form.string('email'));
              setInviteFeedback(
                result.delivered
                  ? 'Invitation sent.'
                  : 'Invitation saved, but email delivery failed. You can resend it below.',
              );
            } catch (error) {
              setInviteFeedback(error instanceof Error ? error.message : 'Invitation failed.');
            }
          }}
        >
          <Label text='Email address'>
            <TextInput
              autoComplete='email'
              name='email'
              placeholder='person@example.com'
              required
              type='email'
            />
          </Label>
          <Btn
            icon={<MailIcon aria-hidden='true' />}
            loading={sendInvitationMutation.isPending}
            type='submit'
          >
            Send invitation
          </Btn>
        </TypedForm>
        {inviteFeedback ? (
          <p aria-live='polite' className={css.feedback}>
            {inviteFeedback}
          </p>
        ) : null}

        {data?.incoming.length ? (
          <div className={css.group}>
            <h3>Invitations for you</h3>
            <ul className={css.friendList}>
              {data.incoming.map((invite) => (
                <li className={css.friendRow} key={invite.id}>
                  <div className={css.friendInfo}>
                    <strong>{invite.inviterName}</strong>
                    <span>{invite.inviterEmail}</span>
                  </div>
                  <div className={css.rowActions}>
                    <Btn
                      icon={<CheckIcon aria-hidden='true' />}
                      loading={acceptInvitationMutation.isPending}
                      onClick={() => acceptInvitationMutation.mutate(invite.id)}
                      size='sm'
                    >
                      Accept
                    </Btn>
                    <Btn
                      aria-label={`Decline invitation from ${invite.inviterName}`}
                      icon={<XIcon aria-hidden='true' />}
                      onClick={() => removeInvitationMutation.mutate(invite.id)}
                      size='sm'
                      variant='ghostDanger'
                    >
                      Decline
                    </Btn>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {data?.connections.length ? (
          <div className={css.group}>
            <h3>Connected people</h3>
            <ul className={css.friendList}>
              {data.connections.map((connection) => (
                <li className={css.friendRow} key={connection.id}>
                  <Avatar.Root className={css.friendAvatar}>
                    {connection.image ? (
                      <Avatar.Image alt='' className={css.avatarImage} src={connection.image} />
                    ) : null}
                    <Avatar.Fallback className={css.friendFallback}>
                      {getInitials(connection.name)}
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <div className={css.friendInfo}>
                    <strong>{connection.name}</strong>
                    <span>{connection.email}</span>
                  </div>
                  <Btn
                    icon={<UserMinusIcon aria-hidden='true' />}
                    onClick={() => disconnectMutation.mutate(connection.id)}
                    size='sm'
                    variant='ghostDanger'
                  >
                    Disconnect
                  </Btn>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {data?.outgoing.length ? (
          <div className={css.group}>
            <h3>Sent invitations</h3>
            <ul className={css.friendList}>
              {data.outgoing.map((invite) => (
                <li className={css.friendRow} key={invite.id}>
                  <div className={css.friendInfo}>
                    <strong>{invite.recipientEmail}</strong>
                    <span>
                      {invite.deliveryFailed ? 'Email delivery failed' : 'Waiting for response'}
                    </span>
                  </div>
                  <div className={css.rowActions}>
                    <Btn
                      onClick={() => sendInvitationMutation.mutate(invite.recipientEmail)}
                      size='sm'
                      variant='outlineMain'
                    >
                      Resend
                    </Btn>
                    <Btn
                      onClick={() => removeInvitationMutation.mutate(invite.id)}
                      size='sm'
                      variant='ghostDanger'
                    >
                      Revoke
                    </Btn>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {!connectionsQuery.isPending &&
        !data?.connections.length &&
        !data?.incoming.length &&
        !data?.outgoing.length ? (
          <p className={css.emptyState}>No connections or pending invitations yet.</p>
        ) : null}
      </Card>
    </main>
  );
}

import { Avatar } from '@base-ui/react/avatar';
import { CheckIcon, MailIcon, UserMinusIcon, UsersIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { Label } from '@/components/ui/label/Label';
import { Skeleton } from '@/components/ui/skeleton/Skeleton';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { getInitials } from '@/lib/getInitials';
import {
  useAcceptConnectionInvitationMutation,
  useConnectionsQuery,
  useDisconnectUserMutation,
  useRemoveConnectionInvitationMutation,
  useSendConnectionInvitationMutation,
} from './account.query';
import css from './AccountPage.module.css';

interface FriendsCardProps {
  invitation?: string;
}

export function FriendsCard({ invitation }: FriendsCardProps) {
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);
  const connectionsQuery = useConnectionsQuery();
  const sendInvitationMutation = useSendConnectionInvitationMutation();
  const acceptInvitationMutation = useAcceptConnectionInvitationMutation();
  const removeInvitationMutation = useRemoveConnectionInvitationMutation();
  const disconnectMutation = useDisconnectUserMutation();
  const data = connectionsQuery.data;
  const isFriendsEmpty =
    data !== undefined &&
    data.connections.length === 0 &&
    data.incoming.length === 0 &&
    data.outgoing.length === 0;

  return (
    <Card
      aria-busy={connectionsQuery.isPending}
      as='section'
      className={css.friendsCard}
      data-appear='1'
    >
      <header className={css.sectionHeader}>
        <div>
          <h2>Friends</h2>
          <p>Invite friends you trust. Sharing stays off until you enable it per item.</p>
        </div>
        <span className={css.friendCount}>
          <UsersIcon aria-hidden='true' />
          {data ? data.connections.length : '—'}
        </span>
      </header>

      {invitation ? (
        <p className={css.invitationNotice}>
          Sign-in succeeded. Review your pending invitation below before becoming friends.
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
          Invite friend
        </Btn>
      </TypedForm>
      {inviteFeedback ? (
        <p aria-live='polite' className={css.feedback}>
          {inviteFeedback}
        </p>
      ) : null}

      {data?.incoming.length ? (
        <div className={css.group}>
          <h3>Friend invitations</h3>
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
          <h3>Your friends</h3>
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
                  Remove friend
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

      {connectionsQuery.isPending ? (
        <div aria-label='Loading friends' className={css.loadingState} role='status'>
          <p className={css.loadingLabel}>Loading friends...</p>
          <ul className={css.loadingList}>
            <li className={css.loadingRow}>
              <Skeleton className={css.loadingAvatar} />
              <div className={css.loadingInfo}>
                <Skeleton className={css.loadingName} />
                <Skeleton className={css.loadingMeta} />
              </div>
            </li>
          </ul>
        </div>
      ) : isFriendsEmpty ? (
        <p className={css.emptyState} data-appear>
          No friends or pending invitations yet.
        </p>
      ) : null}
    </Card>
  );
}

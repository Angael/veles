import { CheckIcon, MailIcon, RefreshCwIcon, UserMinusIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { Label } from '@/components/ui/label/Label';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import {
  useAcceptConnectionInvitationMutation,
  useConnectionsQuery,
  useDisconnectUserMutation,
  useRemoveConnectionInvitationMutation,
  useSendConnectionInvitationMutation,
} from './account.query';
import { FriendRow, FriendRowSkeleton } from './FriendRow';
import css from './AccountPage.module.css';

export function FriendsCard() {
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);
  const connectionsQuery = useConnectionsQuery();
  const sendInvitationMutation = useSendConnectionInvitationMutation();
  const acceptInvitationMutation = useAcceptConnectionInvitationMutation();
  const removeInvitationMutation = useRemoveConnectionInvitationMutation();
  const disconnectMutation = useDisconnectUserMutation();
  const data = connectionsQuery.data;

  const hasPeople =
    data !== undefined &&
    (data.connections.length > 0 || data.incoming.length > 0 || data.outgoing.length > 0);

  const loadingState = connectionsQuery.isPending ? (
    <div aria-label='Loading friends' role='status'>
      <ul>
        <FriendRowSkeleton />
      </ul>
    </div>
  ) : null;

  const emptyState =
    !connectionsQuery.isPending && !hasPeople ? (
      <p className={css.emptyState} data-appear>
        No friends or pending invitations yet.
      </p>
    ) : null;

  return (
    <Card
      aria-busy={connectionsQuery.isPending}
      as='section'
      className={css.friendsCard}
      data-appear='1'
    >
      <header className={css.sectionHeader}>
        <h2>Friends</h2>
      </header>

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

      {hasPeople ? (
        <ul>
          {data.connections.map((connection) => (
            <FriendRow
              actions={
                <Btn
                  aria-label={`Remove ${connection.name} as a friend`}
                  icon={<UserMinusIcon aria-hidden='true' />}
                  iconOnly
                  onClick={() => disconnectMutation.mutate(connection.id)}
                  variant='ghostDanger'
                />
              }
              detail={connection.email}
              image={connection.image}
              key={connection.id}
              name={connection.name}
            />
          ))}
          {data.incoming.map((invite) => (
            <FriendRow
              actions={
                <>
                  <Btn
                    aria-label={`Accept invitation from ${invite.inviterName}`}
                    icon={<CheckIcon aria-hidden='true' />}
                    iconOnly
                    loading={acceptInvitationMutation.isPending}
                    onClick={() => acceptInvitationMutation.mutate(invite.id)}
                  />
                  <Btn
                    aria-label={`Decline invitation from ${invite.inviterName}`}
                    icon={<XIcon aria-hidden='true' />}
                    iconOnly
                    onClick={() => removeInvitationMutation.mutate(invite.id)}
                    variant='ghostDanger'
                  />
                </>
              }
              detail={`${invite.inviterEmail} · Invited you`}
              image={invite.inviterImage}
              key={invite.id}
              name={invite.inviterName}
            />
          ))}
          {data.outgoing.map((invite) => (
            <FriendRow
              actions={
                <>
                  <Btn
                    aria-label={`Resend invitation to ${invite.recipientEmail}`}
                    icon={<RefreshCwIcon aria-hidden='true' />}
                    iconOnly
                    onClick={() => sendInvitationMutation.mutate(invite.recipientEmail)}
                    variant='outlineMain'
                  />
                  <Btn
                    aria-label={`Revoke invitation to ${invite.recipientEmail}`}
                    icon={<XIcon aria-hidden='true' />}
                    iconOnly
                    onClick={() => removeInvitationMutation.mutate(invite.id)}
                    variant='ghostDanger'
                  />
                </>
              }
              detail={invite.deliveryFailed ? 'Email delivery failed' : 'Invitation sent'}
              key={invite.id}
              name={invite.recipientEmail}
            />
          ))}
        </ul>
      ) : null}

      {loadingState}
      {emptyState}
    </Card>
  );
}

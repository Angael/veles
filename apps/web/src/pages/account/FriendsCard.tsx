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
import { SharingSettings } from './SharingSettings';
import css from './AccountPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function FriendsCard() {
  const { t } = useI18n();
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
    <div aria-label={t({ en: 'Loading friends', pl: 'Wczytywanie znajomych' })} role='status'>
      <ul>
        <FriendRowSkeleton />
      </ul>
    </div>
  ) : null;

  const emptyState =
    !connectionsQuery.isPending && !hasPeople ? (
      <p className={css.emptyState} data-appear>
        {t({
          en: 'No friends or pending invitations yet.',
          pl: 'Nie masz jeszcze znajomych ani oczekujących zaproszeń.',
        })}
      </p>
    ) : null;

  return (
    <Card
      aria-busy={connectionsQuery.isPending}
      as='section'
      className={css.friendsCard}
      data-appear='1'
      id='friends'
    >
      <header className={css.sectionHeader}>
        <div>
          <h2>{t({ en: 'Friends', pl: 'Znajomi' })}</h2>
          <p>
            {t({
              en: 'Invite friends and choose what they can see.',
              pl: 'Zaproś znajomych i wybierz, co mogą zobaczyć.',
            })}
          </p>
        </div>
      </header>

      <TypedForm
        className={css.inviteForm}
        onSubmit={async (form) => {
          setInviteFeedback(null);
          try {
            const result = await sendInvitationMutation.mutateAsync(form.string('email'));
            setInviteFeedback(
              result.delivered
                ? t({ en: 'Invitation sent.', pl: 'Zaproszenie wysłane.' })
                : t({
                    en: 'Invitation saved, but email delivery failed. You can resend it below.',
                    pl: 'Zaproszenie zapisane, ale nie udało się wysłać e-maila. Możesz wysłać je ponownie poniżej.',
                  }),
            );
          } catch (error) {
            setInviteFeedback(
              error instanceof Error
                ? error.message
                : t({ en: 'Invitation failed.', pl: 'Nie udało się wysłać zaproszenia.' }),
            );
          }
        }}
      >
        <Label text={t({ en: 'Email address', pl: 'Adres e-mail' })}>
          <TextInput
            autoComplete='email'
            name='email'
            placeholder={t({ en: 'person@example.com', pl: 'osoba@example.com' })}
            required
            type='email'
          />
        </Label>
        <Btn
          icon={<MailIcon aria-hidden='true' />}
          loading={sendInvitationMutation.isPending}
          type='submit'
        >
          {t({ en: 'Invite friend', pl: 'Zaproś znajomego' })}
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
                  aria-label={t({
                    en: `Remove ${connection.name} as a friend`,
                    pl: `Usuń ${connection.name} ze znajomych`,
                  })}
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
                    aria-label={t({
                      en: `Accept invitation from ${invite.inviterName}`,
                      pl: `Przyjmij zaproszenie od: ${invite.inviterName}`,
                    })}
                    icon={<CheckIcon aria-hidden='true' />}
                    iconOnly
                    loading={acceptInvitationMutation.isPending}
                    onClick={() => acceptInvitationMutation.mutate(invite.id)}
                  />
                  <Btn
                    aria-label={t({
                      en: `Decline invitation from ${invite.inviterName}`,
                      pl: `Odrzuć zaproszenie od: ${invite.inviterName}`,
                    })}
                    icon={<XIcon aria-hidden='true' />}
                    iconOnly
                    onClick={() => removeInvitationMutation.mutate(invite.id)}
                    variant='ghostDanger'
                  />
                </>
              }
              detail={`${invite.inviterEmail} · ${t({ en: 'Invited you', pl: 'Zaprasza Cię' })}`}
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
                    aria-label={t({
                      en: `Resend invitation to ${invite.recipientEmail}`,
                      pl: `Wyślij ponownie zaproszenie do: ${invite.recipientEmail}`,
                    })}
                    icon={<RefreshCwIcon aria-hidden='true' />}
                    iconOnly
                    onClick={() => sendInvitationMutation.mutate(invite.recipientEmail)}
                    variant='outlineMain'
                  />
                  <Btn
                    aria-label={t({
                      en: `Revoke invitation to ${invite.recipientEmail}`,
                      pl: `Cofnij zaproszenie do: ${invite.recipientEmail}`,
                    })}
                    icon={<XIcon aria-hidden='true' />}
                    iconOnly
                    onClick={() => removeInvitationMutation.mutate(invite.id)}
                    variant='ghostDanger'
                  />
                </>
              }
              detail={
                invite.deliveryFailed
                  ? t({ en: 'Email delivery failed', pl: 'Nie udało się wysłać e-maila' })
                  : t({ en: 'Invitation sent', pl: 'Zaproszenie wysłane' })
              }
              key={invite.id}
              name={invite.recipientEmail}
            />
          ))}
        </ul>
      ) : null}

      {loadingState}
      {emptyState}

      <SharingSettings />
    </Card>
  );
}

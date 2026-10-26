import { Avatar } from '@base-ui/react/avatar';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { SendIcon } from 'lucide-react';
import { useState } from 'react';
import type { CalorieLog } from '../calories.api';
import { foodShareRecipientsQueryOptions, useShareFoodLogsMutation } from './foodLogShares.query';
import { Btn } from '@/components/ui/btn/Btn';
import { Checkbox } from '@/components/ui/checkbox/Checkbox';
import {
  DialogActions,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog/Dialog';
import { SelectionBarAction } from '@/components/ui/selection-bar/SelectionBar';
import { toastManager } from '@/components/ui/toast/toastManager';
import { getInitials } from '@/lib/getInitials';
import { ShareLogsItems } from './ShareLogsItems';
import css from './ShareLogsAction.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { productCountText } from '../calorieHelpers';

type Props = {
  logs: CalorieLog[];
  onShared: () => void;
};

const gramsByLogId = (logs: CalorieLog[]) =>
  Object.fromEntries(
    logs.map((entry) => [entry.id, entry.grams === null ? null : Math.round(entry.grams)]),
  );

/**
 * Picks friends who each receive a copy of the selected logs to accept into their own diary. The
 * sender can adjust each log's grams first, e.g. to share only the friend's half of a meal.
 */
export function ShareLogsAction({ logs, onShared }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  // null until the user picks: a lone friend is preselected without waiting for an effect.
  const [pickedIds, setPickedIds] = useState<string[] | null>(null);
  const [gramsById, setGramsById] = useState<Record<string, number | null>>({});
  const friendsQuery = useQuery(foodShareRecipientsQueryOptions());
  const shareMutation = useShareFoodLogsMutation();
  const friends = friendsQuery.data ?? [];
  const recipientIds =
    pickedIds ?? (friends.length === 1 ? friends.map((friend) => friend.id) : []);
  const products = t(productCountText(logs.length));
  const gramsValid = logs.every((entry) => entry.grams === null || (gramsById[entry.id] ?? 0) > 0);

  function share() {
    const names = friends
      .filter((friend) => recipientIds.includes(friend.id))
      .map((friend) => friend.name);
    shareMutation.mutate(
      {
        items: logs.map((entry) => ({ grams: gramsById[entry.id] ?? null, logId: entry.id })),
        recipientUserIds: recipientIds,
      },
      {
        onSuccess: () => {
          toastManager.add({
            title: t({
              en: `Shared ${products} with ${names.join(', ')}`,
              pl: `Udostępniono ${products} dla: ${names.join(', ')}`,
            }),
            type: 'success',
          });
          setOpen(false);
          onShared();
        },
      },
    );
  }

  function friendsStatus() {
    if (friendsQuery.isPending)
      return <p role='status'>{t({ en: 'Loading friends…', pl: 'Wczytywanie znajomych…' })}</p>;
    if (friendsQuery.isError)
      return (
        <p role='alert'>
          {t({ en: 'Could not load your friends.', pl: 'Nie udało się wczytać znajomych.' })}
        </p>
      );
    return (
      <p>
        {t({ en: 'No friends yet.', pl: 'Nie masz jeszcze znajomych.' })}{' '}
        <Link to='/account'>{t({ en: 'Invite friends', pl: 'Zaproś znajomych' })}</Link>
        {t({
          en: ' to share products with them.',
          pl: ', aby udostępniać im produkty.',
        })}
      </p>
    );
  }

  return (
    <DialogRoot
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) return;
        setPickedIds(null);
        setGramsById(gramsByLogId(logs));
      }}
      open={open}
    >
      <SelectionBarAction
        icon={<SendIcon aria-hidden='true' />}
        label={t({ en: 'Share', pl: 'Udostępnij' })}
        primary
        render={<DialogTrigger />}
      />
      <DialogPopup>
        <DialogTitle>{t({ en: `Share ${products}`, pl: `Udostępnij ${products}` })}</DialogTitle>
        <DialogDescription>
          {t({
            en: `They get a copy of these ${products} to add to their own diary.`,
            pl: `Otrzymają kopię (${products}), którą dodadzą do własnego dziennika.`,
          })}
        </DialogDescription>
        <ShareLogsItems
          gramsById={gramsById}
          logs={logs}
          onGramsChange={(id, grams) => setGramsById((current) => ({ ...current, [id]: grams }))}
        />
        {friends.length === 0 ? (
          friendsStatus()
        ) : (
          <ul className={css.friends}>
            {friends.map((friend) => (
              <li key={friend.id}>
                <label className={css.friend}>
                  <Avatar.Root aria-hidden='true' className={css.avatar}>
                    {friend.image ? (
                      <Avatar.Image alt='' className={css.avatarImage} src={friend.image} />
                    ) : null}
                    <Avatar.Fallback>{getInitials(friend.name)}</Avatar.Fallback>
                  </Avatar.Root>
                  <span className={css.name}>{friend.name}</span>
                  <Checkbox
                    checked={recipientIds.includes(friend.id)}
                    onCheckedChange={(checked) =>
                      setPickedIds(
                        checked
                          ? [...recipientIds, friend.id]
                          : recipientIds.filter((id) => id !== friend.id),
                      )
                    }
                  />
                </label>
              </li>
            ))}
          </ul>
        )}
        <DialogActions>
          <DialogClose render={<Btn variant='ghost' />}>
            {t({ en: 'Cancel', pl: 'Anuluj' })}
          </DialogClose>
          <Btn
            disabled={recipientIds.length === 0 || !gramsValid}
            icon={<SendIcon aria-hidden='true' />}
            loading={shareMutation.isPending}
            onClick={share}
          >
            {t({ en: 'Share', pl: 'Udostępnij' })}
          </Btn>
        </DialogActions>
      </DialogPopup>
    </DialogRoot>
  );
}

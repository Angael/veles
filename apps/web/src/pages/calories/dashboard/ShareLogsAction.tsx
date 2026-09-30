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
import css from './ShareLogsAction.module.css';

type Props = {
  logs: CalorieLog[];
  onShared: () => void;
};

/** Picks friends who each receive a copy of the selected logs to accept into their own diary. */
export function ShareLogsAction({ logs, onShared }: Props) {
  const [open, setOpen] = useState(false);
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const friendsQuery = useQuery(foodShareRecipientsQueryOptions());
  const shareMutation = useShareFoodLogsMutation();
  const friends = friendsQuery.data ?? [];
  const products = `${logs.length} ${logs.length === 1 ? 'product' : 'products'}`;

  function share() {
    const names = friends
      .filter((friend) => recipientIds.includes(friend.id))
      .map((friend) => friend.name);
    shareMutation.mutate(
      { logIds: logs.map((entry) => entry.id), recipientUserIds: recipientIds },
      {
        onSuccess: () => {
          toastManager.add({
            title: `Shared ${products} with ${names.join(', ')}`,
            type: 'success',
          });
          setOpen(false);
          setRecipientIds([]);
          onShared();
        },
      },
    );
  }

  function friendsStatus() {
    if (friendsQuery.isPending) return <p role='status'>Loading friends…</p>;
    if (friendsQuery.isError) return <p role='alert'>Could not load your friends.</p>;
    return (
      <p>
        No friends yet. <Link to='/account'>Invite friends</Link> to share products with them.
      </p>
    );
  }

  return (
    <DialogRoot onOpenChange={setOpen} open={open}>
      <SelectionBarAction
        icon={<SendIcon aria-hidden='true' />}
        label='Share'
        primary
        render={<DialogTrigger />}
      />
      <DialogPopup>
        <DialogTitle>Share {products}</DialogTitle>
        <DialogDescription>
          They get a copy of these {products} to add to their own diary.
        </DialogDescription>
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
                      setRecipientIds((current) =>
                        checked
                          ? [...current, friend.id]
                          : current.filter((id) => id !== friend.id),
                      )
                    }
                  />
                </label>
              </li>
            ))}
          </ul>
        )}
        <DialogActions>
          <DialogClose render={<Btn variant='ghost' />}>Cancel</DialogClose>
          <Btn
            disabled={recipientIds.length === 0}
            icon={<SendIcon aria-hidden='true' />}
            loading={shareMutation.isPending}
            onClick={share}
          >
            Share
          </Btn>
        </DialogActions>
      </DialogPopup>
    </DialogRoot>
  );
}

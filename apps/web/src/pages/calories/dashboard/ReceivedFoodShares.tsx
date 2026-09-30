import { useQuery } from '@tanstack/react-query';
import { CheckIcon, XIcon } from 'lucide-react';
import { FoodSummary } from '../FoodSummary';
import {
  receivedFoodLogSharesQueryOptions,
  useAcceptFoodLogShareMutation,
  useDeclineFoodLogShareMutation,
} from './foodLogShares.query';
import type { ReceivedFoodLogShare } from './foodLogShares.api';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { List, ListItem } from '@/components/ui/list/List';
import { toastManager } from '@/components/ui/toast/toastManager';
import css from './ReceivedFoodShares.module.css';

type Props = {
  date: string;
};

const productCount = (count: number) => `${count} ${count === 1 ? 'product' : 'products'}`;

/** Incoming logs shown like the user's own, wrapped in a card that accepts or declines them all at once. */
export function ReceivedFoodShares({ date }: Props) {
  const sharesQuery = useQuery(receivedFoodLogSharesQueryOptions());
  const acceptMutation = useAcceptFoodLogShareMutation();
  const declineMutation = useDeclineFoodLogShareMutation();

  function accept(share: ReceivedFoodLogShare) {
    acceptMutation.mutate(
      { date, id: share.id },
      {
        onSuccess: () =>
          toastManager.add({
            title: `Added ${productCount(share.items.length)} from ${share.senderName}`,
            type: 'success',
          }),
      },
    );
  }

  function decline(share: ReceivedFoodLogShare) {
    declineMutation.mutate(share.id, {
      onSuccess: () =>
        toastManager.add({
          title: `Declined ${productCount(share.items.length)} from ${share.senderName}`,
        }),
    });
  }

  return (sharesQuery.data ?? []).map((share) => {
    const count = share.items.length;
    const headingId = `share-${share.id}`;
    const accepting = acceptMutation.isPending && acceptMutation.variables.id === share.id;
    const declining = declineMutation.isPending && declineMutation.variables === share.id;
    return (
      <Card
        aria-labelledby={headingId}
        as='article'
        className={css.share}
        key={share.id}
        shadow={false}
        tone='primary'
      >
        <h3 className={css.heading} id={headingId}>
          {share.senderName} shared {count === 1 ? 'a product' : `${count} products`} with you
        </h3>
        <List as='ol'>
          {share.items.map((item) => (
            <ListItem key={item.id} style={{ padding: 0 }}>
              <FoodSummary
                carbs={item.carbs ?? 0}
                density='compact'
                fat={item.fat ?? 0}
                imageUrl={item.imageUrl}
                kcal={item.kcal}
                meta={item.grams === null ? 'Custom entry' : `${Math.round(item.grams)} g`}
                name={item.name}
                protein={item.protein ?? 0}
              />
            </ListItem>
          ))}
        </List>
        <div className={css.actions}>
          <Btn
            disabled={accepting}
            icon={<XIcon aria-hidden='true' />}
            loading={declining}
            onClick={() => decline(share)}
            variant='ghost'
          >
            Decline
          </Btn>
          <Btn
            disabled={declining}
            icon={<CheckIcon aria-hidden='true' />}
            loading={accepting}
            onClick={() => accept(share)}
          >
            {count === 1 ? 'Add to diary' : 'Add all to diary'}
          </Btn>
        </div>
      </Card>
    );
  });
}

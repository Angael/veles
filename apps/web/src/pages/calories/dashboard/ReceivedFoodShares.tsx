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
import { useI18n } from '@/lib/i18n/I18nProvider';
import { productCountText } from '../calorieHelpers';

type Props = {
  date: string;
};

/** Incoming logs shown like the user's own, wrapped in a card that accepts or declines them all at once. */
export function ReceivedFoodShares({ date }: Props) {
  const { formatNumber, t } = useI18n();
  const sharesQuery = useQuery(receivedFoodLogSharesQueryOptions());
  const acceptMutation = useAcceptFoodLogShareMutation();
  const declineMutation = useDeclineFoodLogShareMutation();

  function accept(share: ReceivedFoodLogShare) {
    acceptMutation.mutate(
      { date, id: share.id },
      {
        onSuccess: () =>
          toastManager.add({
            title: t({
              en: `Added ${t(productCountText(share.items.length))} from ${share.senderName}`,
              pl: `Dodano ${t(productCountText(share.items.length))} od: ${share.senderName}`,
            }),
            type: 'success',
          }),
      },
    );
  }

  function decline(share: ReceivedFoodLogShare) {
    declineMutation.mutate(share.id, {
      onSuccess: () =>
        toastManager.add({
          title: t({
            en: `Declined ${t(productCountText(share.items.length))} from ${share.senderName}`,
            pl: `Odrzucono ${t(productCountText(share.items.length))} od: ${share.senderName}`,
          }),
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
          {t({
            en: `${share.senderName} shared ${count === 1 ? 'a product' : `${count} products`} with you`,
            pl: `${share.senderName} udostępnia Ci ${t(productCountText(count))}`,
          })}
        </h3>
        <List as='ol'>
          {share.items.map((item) => (
            <ListItem key={item.id} style={{ padding: 0 }}>
              <FoodSummary
                carbs={item.carbs}
                density='compact'
                fat={item.fat}
                category={item.category}
                imageUrl={item.imageUrl}
                kcal={item.kcal}
                meta={
                  item.grams === null
                    ? t({ en: 'Custom entry', pl: 'Własny wpis' })
                    : `${formatNumber(Math.round(item.grams))} g`
                }
                name={item.name}
                protein={item.protein}
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
            {t({ en: 'Decline', pl: 'Odrzuć' })}
          </Btn>
          <Btn
            disabled={declining}
            icon={<CheckIcon aria-hidden='true' />}
            loading={accepting}
            onClick={() => accept(share)}
          >
            {count === 1
              ? t({ en: 'Add to diary', pl: 'Dodaj do dziennika' })
              : t({ en: 'Add all to diary', pl: 'Dodaj wszystkie do dziennika' })}
          </Btn>
        </div>
      </Card>
    );
  });
}

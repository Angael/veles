import { useQuery } from '@tanstack/react-query';
import { CheckIcon, XIcon } from 'lucide-react';
import { FoodSummary } from '../FoodSummary';
import {
  receivedFoodLogSharesQueryOptions,
  useAcceptFoodLogShareMutation,
  useDeclineFoodLogShareMutation,
} from './foodLogShares.query';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { List, ListItem } from '@/components/ui/list/List';
import { toastManager } from '@/components/ui/toast/toastManager';
import css from './ReceivedFoodShares.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { productCountText } from '../calorieHelpers';

/**
 * Incoming logs shown like the user's own, wrapped in a card that accepts or declines them all at once.
 * Accepting adds them to the day the sender chose, which may not be the viewed day, so a toast names it.
 */
export function ReceivedFoodShares() {
  const { formatDate, formatWhole, t } = useI18n();
  const sharesQuery = useQuery(receivedFoodLogSharesQueryOptions());
  const acceptMutation = useAcceptFoodLogShareMutation();
  const declineMutation = useDeclineFoodLogShareMutation();

  return (sharesQuery.data ?? []).map((share) => {
    const count = share.items.length;
    const headingId = `share-${share.id}`;
    const accepting = acceptMutation.isPending && acceptMutation.variables === share.id;
    const declining = declineMutation.isPending && declineMutation.variables === share.id;
    const day = formatDate(share.date, { day: 'numeric', month: 'short', weekday: 'short' });
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
        <p className={css.date}>{t({ en: `For ${day}`, pl: `Na dzień: ${day}` })}</p>
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
                    : `${formatWhole(item.grams)} g`
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
            onClick={() => declineMutation.mutate(share.id)}
            variant='danger'
          >
            {t({ en: 'Decline', pl: 'Odrzuć' })}
          </Btn>
          <Btn
            disabled={declining}
            icon={<CheckIcon aria-hidden='true' />}
            loading={accepting}
            onClick={() =>
              acceptMutation.mutate(share.id, {
                onSuccess: () =>
                  toastManager.add({
                    title: t({ en: `Added to ${day}`, pl: `Dodano: ${day}` }),
                    type: 'success',
                  }),
              })
            }
          >
            {t({ en: 'Add', pl: 'Dodaj' })}
          </Btn>
        </div>
      </Card>
    );
  });
}

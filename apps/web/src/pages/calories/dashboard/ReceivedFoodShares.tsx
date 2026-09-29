import { CheckIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { FoodSummary } from '../FoodSummary';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { List, ListItem } from '@/components/ui/list/List';
import { toastManager } from '@/components/ui/toast/toastManager';
import css from './ReceivedFoodShares.module.css';

/** Preview-only incoming shares until sharing exists in the data model. */
const previewShares = [
  {
    id: 'maya-breakfast',
    sender: 'Maya Chen',
    products: [
      { id: 'yogurt', name: 'Greek yogurt', grams: 170, kcal: 130, protein: 17, fat: 4, carbs: 7 },
      { id: 'berries', name: 'Blueberries', grams: 80, kcal: 46, protein: 1, fat: 0, carbs: 12 },
    ],
  },
  {
    id: 'leo-snack',
    sender: 'Leo Novak',
    products: [
      {
        id: 'toast',
        name: 'Almond butter toast',
        grams: 60,
        kcal: 245,
        protein: 9,
        fat: 14,
        carbs: 22,
      },
    ],
  },
];

/** Incoming logs shown like the user's own, wrapped in a card that accepts or declines them all at once. */
export function ReceivedFoodShares() {
  const [handledIds, setHandledIds] = useState<string[]>([]);
  const pending = previewShares.filter((share) => !handledIds.includes(share.id));

  function decide(share: (typeof previewShares)[number], accepted: boolean) {
    setHandledIds((current) => [...current, share.id]);
    const count = share.products.length;
    const products = `${count} ${count === 1 ? 'product' : 'products'}`;
    toastManager.add({
      description: 'Preview only: your diary was not changed.',
      title: accepted
        ? `Added ${products} from ${share.sender}`
        : `Declined ${products} from ${share.sender}`,
      type: accepted ? 'success' : undefined,
    });
  }

  return pending.map((share) => {
    const count = share.products.length;
    const headingId = `share-${share.id}`;
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
          {share.sender} shared {count === 1 ? 'a product' : `${count} products`} with you
        </h3>
        <List as='ol'>
          {share.products.map((product) => (
            <ListItem key={product.id} style={{ padding: 0 }}>
              <FoodSummary
                carbs={product.carbs}
                density='compact'
                fat={product.fat}
                imageUrl={null}
                kcal={product.kcal}
                meta={`${product.grams} g`}
                name={product.name}
                protein={product.protein}
              />
            </ListItem>
          ))}
        </List>
        <div className={css.actions}>
          <Btn
            icon={<XIcon aria-hidden='true' />}
            onClick={() => decide(share, false)}
            variant='ghost'
          >
            Decline
          </Btn>
          <Btn icon={<CheckIcon aria-hidden='true' />} onClick={() => decide(share, true)}>
            {count === 1 ? 'Add to diary' : 'Add all to diary'}
          </Btn>
        </div>
      </Card>
    );
  });
}

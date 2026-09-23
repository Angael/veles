import { CheckIcon, RotateCcwIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { FoodSummary } from '../FoodSummary';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import css from './ReceivedFoodShares.module.css';

type Decision = 'pending' | 'accepted' | 'declined';
const decisionLabels: Record<Decision, string> = {
  pending: 'Pending',
  accepted: 'Accepted in preview',
  declined: 'Declined in preview',
};

const shares = [
  {
    id: 'breakfast',
    sender: 'Maya Chen',
    products: [
      { name: 'Greek yogurt', amount: '170 g', kcal: 130, protein: 17, fat: 4, carbs: 7 },
      { name: 'Blueberries', amount: '80 g', kcal: 46, protein: 1, fat: 0, carbs: 12 },
    ],
  },
  {
    id: 'snack',
    sender: 'Leo',
    products: [
      { name: 'Almond butter toast', amount: '1 slice', kcal: 245, protein: 9, fat: 14, carbs: 22 },
    ],
  },
] as const;

export function ReceivedFoodShares() {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [announcement, setAnnouncement] = useState('');
  const pendingCount = shares.filter(
    (share) => !decisions[share.id] || decisions[share.id] === 'pending',
  ).length;

  function decide(id: string, sender: string, decision: Exclude<Decision, 'pending'>) {
    setDecisions((current) => ({ ...current, [id]: decision }));
    setAnnouncement(
      `${sender}'s shared products ${decision} in this preview only. Your foods were not changed.`,
    );
  }

  function reset() {
    setDecisions({});
    setAnnouncement('Preview reset. Both shared product examples are pending again.');
  }

  return (
    <section aria-labelledby='received-food-shares-heading' className={css.section}>
      <div className={css.heading}>
        <div>
          <h2 id='received-food-shares-heading'>Products shared with you</h2>
          <p>
            Preview only · Example shares. Decisions stay on this screen and do not save products to
            your foods.
          </p>
        </div>
        {pendingCount < shares.length ? (
          <Btn
            icon={<RotateCcwIcon aria-hidden='true' />}
            onClick={reset}
            size='md'
            variant='outlineMain'
          >
            Reset preview
          </Btn>
        ) : null}
      </div>
      <p className={css.count}>
        {pendingCount === 0
          ? 'No pending examples'
          : `${pendingCount} pending example${pendingCount === 1 ? '' : 's'}`}
      </p>
      <div aria-live='polite' className={css.srOnly} role='status'>
        {announcement}
      </div>
      <div className={css.shares}>
        {shares.map((share) => {
          const decision = decisions[share.id] ?? 'pending';
          return (
            <Card as='article' className={css.share} key={share.id} shadow={false}>
              <div className={css.shareHeading}>
                <h3>From {share.sender}</h3>
                <span className={decision === 'pending' ? css.pending : css.handled}>
                  {decisionLabels[decision]}
                </span>
              </div>
              <div
                aria-label='Nutrition per product: calories, protein grams, fat grams, carbohydrate grams'
                className={css.products}
                role='group'
              >
                {share.products.map((product) => (
                  <FoodSummary
                    carbs={product.carbs}
                    density='compact'
                    fat={product.fat}
                    imageUrl={null}
                    kcal={product.kcal}
                    key={product.name}
                    meta={product.amount}
                    name={product.name}
                    protein={product.protein}
                  />
                ))}
              </div>
              {decision === 'pending' ? (
                <div className={css.actions}>
                  <Btn
                    aria-label={`Accept ${share.sender}'s shared products in preview`}
                    icon={<CheckIcon aria-hidden='true' />}
                    onClick={() => decide(share.id, share.sender, 'accepted')}
                    size='md'
                  >
                    Accept
                  </Btn>
                  <Btn
                    aria-label={`Decline ${share.sender}'s shared products in preview`}
                    icon={<XIcon aria-hidden='true' />}
                    onClick={() => decide(share.id, share.sender, 'declined')}
                    size='md'
                    variant='outlineDanger'
                  >
                    Decline
                  </Btn>
                </div>
              ) : (
                <p className={css.feedback}>
                  {decision === 'accepted'
                    ? 'Accepted for this preview. No products were saved to your foods.'
                    : 'Declined for this preview. No products were changed.'}
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}

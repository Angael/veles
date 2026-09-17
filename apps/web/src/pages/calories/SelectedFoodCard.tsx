import { Link } from '@tanstack/react-router';
import { PencilIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { NutritionInline } from './NutritionInline';
import css from './SelectedFoodCard.module.css';

type SelectedFoodCardProps = {
  carbs: number;
  fat: number;
  imageUrl: string | null;
  kcal: number;
  name: string;
  productId: string;
  protein: number;
};

/** Shows the selected catalog food and keeps product editing close without crowding form actions. */
export function SelectedFoodCard({
  carbs,
  fat,
  imageUrl,
  kcal,
  name,
  productId,
  protein,
}: SelectedFoodCardProps) {
  return (
    <section className={css.product}>
      {imageUrl ? <img alt='' src={imageUrl} /> : null}
      <div className={css.productBody}>
        <div className={css.productHeading}>
          <strong>{name}</strong>
          <Btn
            aria-label={`Edit ${name}`}
            icon={<PencilIcon aria-hidden='true' />}
            iconOnly
            isLink
            render={<Link params={{ foodId: productId }} to='/calories/foods/$foodId' />}
            size='sm'
            variant='ghost'
          />
        </div>
        <NutritionInline kcal={kcal} protein={protein} fat={fat} carbs={carbs} />
      </div>
    </section>
  );
}

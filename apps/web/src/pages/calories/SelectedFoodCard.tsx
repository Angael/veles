import { Link } from '@tanstack/react-router';
import { PencilIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
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

function EditFoodButton({ name, productId }: Pick<SelectedFoodCardProps, 'name' | 'productId'>) {
  return (
    <Btn
      aria-label={`Edit ${name}`}
      className={css.editButton}
      icon={<PencilIcon aria-hidden='true' />}
      iconOnly
      isLink
      render={<Link params={{ foodId: productId }} to='/calories/foods/$foodId' />}
      size='sm'
      variant='ghost'
    />
  );
}

/** Shows the selected food in a compact summary with an optional product image. */
export function SelectedFoodCard(props: SelectedFoodCardProps) {
  return (
    <Card aria-label='Selected food' as='section' className={css.compact}>
      {props.imageUrl ? <img alt='' aria-hidden='true' src={props.imageUrl} /> : null}
      <div className={css.compactBody}>
        <strong>{props.name}</strong>
        <div className={css.compactNutrition}>
          <NutritionInline
            carbs={props.carbs}
            fat={props.fat}
            kcal={props.kcal}
            protein={props.protein}
            stackEnergyOnPhone
          />
        </div>
      </div>
      <EditFoodButton name={props.name} productId={props.productId} />
    </Card>
  );
}

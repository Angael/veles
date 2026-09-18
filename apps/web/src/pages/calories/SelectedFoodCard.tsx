import { Link } from '@tanstack/react-router';
import { PencilIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { FoodSummaryCard, type FoodSummaryProps } from './FoodSummary';

type SelectedFoodCardProps = Omit<FoodSummaryProps, 'action' | 'meta' | 'name'> & {
  name: string;
  productId: string;
};

function EditFoodButton({ name, productId }: Pick<SelectedFoodCardProps, 'name' | 'productId'>) {
  return (
    <Btn
      aria-label={`Edit ${name}`}
      icon={<PencilIcon aria-hidden='true' />}
      iconOnly
      isLink
      render={<Link params={{ foodId: productId }} to='/calories/foods/$foodId' />}
      size='sm'
      variant='ghost'
    />
  );
}

/** Shows the selected food in a reusable compact food summary card. */
export function SelectedFoodCard({ productId, ...props }: SelectedFoodCardProps) {
  return (
    <FoodSummaryCard
      {...props}
      action={<EditFoodButton name={props.name} productId={productId} />}
      ariaLabel='Selected food'
    />
  );
}

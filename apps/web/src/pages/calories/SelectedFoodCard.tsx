import { Link } from '@tanstack/react-router';
import { PencilIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { FoodSummary, type FoodSummaryProps } from './FoodSummary';

type SelectedFoodCardProps = Omit<FoodSummaryProps, 'action' | 'meta' | 'name'> & {
  name: string;
  productId: string;
  /** Set when shown in Add food, so saving the product edit returns to Add food. */
  addFoodDate?: string;
};

export function SelectedFoodCard({ addFoodDate, productId, ...props }: SelectedFoodCardProps) {
  return (
    <Card aria-label='Selected food' as='section' style={{ padding: 0 }}>
      <FoodSummary
        {...props}
        action={
          <Btn
            aria-label={`Edit ${props.name}`}
            icon={<PencilIcon aria-hidden='true' />}
            iconOnly
            isLink
            render={
              <Link
                params={{ foodId: productId }}
                search={addFoodDate ? { date: addFoodDate, from: 'add' } : {}}
                to='/calories/foods/$foodId'
              />
            }
            size='sm'
            variant='ghost'
          />
        }
      />
    </Card>
  );
}

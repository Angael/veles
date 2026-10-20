import { useNavigate } from '@tanstack/react-router';
import type { CalorieFood } from '../calories.api';
import { useUpdateFoodProductMutation } from '../calories.query';
import { FoodEditor, type FoodEditorValue } from './FoodEditor';
import { useUnsavedChangesGuard } from '@/lib/useUnsavedChangesGuard';
import { todayLocalDate } from '@/lib/dateOnly';

type Props = {
  /** Set when opened from Add food: saving returns there with this product and date. */
  addFoodDate?: string;
  food: CalorieFood;
};

export function EditFoodPage({ addFoodDate, food }: Props) {
  const navigate = useNavigate();
  const updateMutation = useUpdateFoodProductMutation();
  const { markDirty, markSaved } = useUnsavedChangesGuard();

  async function save(value: FoodEditorValue) {
    await updateMutation.mutateAsync({ ...value, id: food.id });
    markSaved();
    if (addFoodDate) {
      await navigate({
        replace: true,
        search: { date: addFoodDate, foodId: food.id },
        to: '/calories/add',
      });
      return;
    }
    await navigate({ replace: true, search: { date: todayLocalDate() }, to: '/calories' });
  }

  return (
    <main>
      <FoodEditor
        errorMsg={updateMutation.error?.message}
        food={food}
        onDirty={markDirty}
        onSubmit={save}
        pending={updateMutation.isPending}
        submitLabel='Save'
      />
    </main>
  );
}

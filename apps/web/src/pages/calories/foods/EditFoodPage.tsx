import { useNavigate } from '@tanstack/react-router';
import type { CalorieFood } from '../calories.api';
import { useUpdateFoodProductMutation } from '../calories.query';
import { FoodEditor, type FoodEditorValue } from './FoodEditor';
import { useUnsavedChangesGuard } from '@/lib/useUnsavedChangesGuard';
import { todayLocalDate } from '@/lib/dateOnly';

export function EditFoodPage({ food }: { food: CalorieFood }) {
  const navigate = useNavigate();
  const updateMutation = useUpdateFoodProductMutation();
  const { markDirty, markSaved } = useUnsavedChangesGuard();

  async function save(value: FoodEditorValue) {
    await updateMutation.mutateAsync({ ...value, id: food.id });
    markSaved();
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

import { useNavigate } from '@tanstack/react-router';
import type { CalorieFood } from '../calories.api';
import { useUpdateFoodProductMutation } from '../calories.query';
import { FoodEditor, type FoodEditorValue } from './FoodEditor';
import { caloriesReturnState } from '../caloriesReturnScroll';
import { useUnsavedChangesGuard } from '@/lib/useUnsavedChangesGuard';
import { todayLocalDate } from '@/lib/dateOnly';
import { useI18n } from '@/lib/i18n/I18nProvider';

type Props = {
  /** Set when opened from Add food: saving returns there with this product and date. */
  addFoodDate?: string;
  food: CalorieFood;
};

export function EditFoodPage({ addFoodDate, food }: Props) {
  const { t } = useI18n();
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
        to: '/calories',
      });
      return;
    }
    const date = todayLocalDate();
    await navigate({
      replace: true,
      search: { date },
      state: caloriesReturnState(date),
      to: '/calories',
    });
  }

  return (
    <main>
      <FoodEditor
        errorMsg={updateMutation.error?.message}
        food={food}
        onDirty={markDirty}
        onSubmit={save}
        pending={updateMutation.isPending}
        submitLabel={t({ en: 'Save', pl: 'Zapisz' })}
      />
    </main>
  );
}

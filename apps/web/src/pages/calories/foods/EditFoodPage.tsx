import { useNavigate } from '@tanstack/react-router';
import type { CalorieFood } from '../calories.api';
import { useUpdateFoodProductMutation } from '../calories.query';
import { FoodEditor, type FoodEditorValue } from './FoodEditor';
import { useUnsavedChangesGuard } from '@/lib/useUnsavedChangesGuard';
import { todayLocalDate } from '@/lib/dateOnly';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function EditFoodPage({ food }: { food: CalorieFood }) {
  const { t } = useI18n();
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
        submitLabel={t({ en: 'Save', pl: 'Zapisz' })}
      />
    </main>
  );
}

import { useNavigate } from '@tanstack/react-router';
import { useCreateFoodProductMutation } from '../calories.query';
import { FoodEditor, type FoodEditorValue } from './FoodEditor';
import { useUnsavedChangesGuard } from '@/lib/useUnsavedChangesGuard';
import { useI18n } from '@/lib/i18n/I18nProvider';

type Props = { barcode?: string; date: string; name?: string };
export function CreateFoodPage({ barcode, date, name }: Props) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const createMutation = useCreateFoodProductMutation();
  const { markDirty, markSaved } = useUnsavedChangesGuard();

  async function save(value: FoodEditorValue) {
    const product = await createMutation.mutateAsync(value);
    markSaved();
    await navigate({ replace: true, search: { date, foodId: product.id }, to: '/calories' });
  }

  return (
    <main>
      <FoodEditor
        errorMsg={createMutation.error?.message}
        initialBarcode={barcode}
        initialName={name}
        onDirty={markDirty}
        onSubmit={save}
        pending={createMutation.isPending}
        submitLabel={t({ en: 'Create food', pl: 'Utwórz produkt' })}
      />
    </main>
  );
}

import { useNavigate } from '@tanstack/react-router';
import { useCreateFoodProductMutation } from '../calories.query';
import { FoodEditor, type FoodEditorValue } from './FoodEditor';
import { useUnsavedChangesGuard } from '@/lib/useUnsavedChangesGuard';
import { FormPage } from '@/components/ui/form-layout/FormLayout';

type Props = { barcode?: string; date: string; name?: string };
export function CreateFoodPage({ barcode, date, name }: Props) {
  const navigate = useNavigate();
  const createMutation = useCreateFoodProductMutation();
  const { markDirty, markSaved } = useUnsavedChangesGuard();

  async function save(value: FoodEditorValue) {
    const product = await createMutation.mutateAsync(value);
    markSaved();
    await navigate({ replace: true, search: { date, foodId: product.id }, to: '/calories/add' });
  }

  return (
    <FormPage lead='Add it once for everyone.'>
      <FoodEditor
        errorMsg={createMutation.error?.message}
        initialBarcode={barcode}
        initialName={name}
        onDirty={markDirty}
        onSubmit={save}
        pending={createMutation.isPending}
        submitLabel='Create food'
      />
    </FormPage>
  );
}

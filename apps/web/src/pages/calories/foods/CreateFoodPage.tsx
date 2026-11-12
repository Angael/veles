import { useNavigate } from '@tanstack/react-router';
import { CameraIcon, PencilIcon } from 'lucide-react';
import { useState } from 'react';
import { useCreateFoodProductMutation } from '../calories.query';
import { caloriesReturnState } from '../caloriesReturnScroll';
import { PhotoScanForm } from '../photo-scan/PhotoScanForm';
import { FoodEditor, type FoodEditorValue } from './FoodEditor';
import { TabsList, TabsPanel, TabsRoot, TabsTab } from '@/components/ui/tabs/Tabs';
import { useUnsavedChangesGuard } from '@/lib/useUnsavedChangesGuard';
import { useI18n } from '@/lib/i18n/I18nProvider';

type Props = { barcode?: string; date: string; log: boolean; name?: string };

/** Creates a product from photos or by hand; a typed name means the user is already typing. */
export function CreateFoodPage({ barcode, date, log, name }: Props) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const createMutation = useCreateFoodProductMutation();
  const { markDirty, markSaved } = useUnsavedChangesGuard();
  const [mode, setMode] = useState<'manual' | 'photos'>(name ? 'manual' : 'photos');

  async function save(value: FoodEditorValue) {
    const product = await createMutation.mutateAsync(value);
    markSaved();
    await navigate({
      replace: true,
      search: { date, foodId: product.id },
      state: caloriesReturnState(date),
      to: '/calories',
    });
  }

  return (
    <main>
      <TabsRoot onValueChange={setMode} value={mode}>
        <TabsList label={t({ en: 'How to add the product', pl: 'Sposób dodania produktu' })}>
          <TabsTab icon={<CameraIcon aria-hidden='true' />} value='photos'>
            {t({ en: 'Photos', pl: 'Zdjęcia' })}
          </TabsTab>
          <TabsTab icon={<PencilIcon aria-hidden='true' />} value='manual'>
            {t({ en: 'Manual', pl: 'Ręcznie' })}
          </TabsTab>
        </TabsList>
        <TabsPanel value='photos'>
          <PhotoScanForm
            date={date}
            initialBarcode={barcode}
            log={log}
            onDirty={markDirty}
            onLeaving={markSaved}
          />
        </TabsPanel>
        <TabsPanel value='manual'>
          <FoodEditor
            errorMsg={createMutation.error?.message}
            initialBarcode={barcode}
            initialName={name}
            onDirty={markDirty}
            onSubmit={save}
            pending={createMutation.isPending}
            submitLabel={t({ en: 'Create food', pl: 'Utwórz produkt' })}
          />
        </TabsPanel>
      </TabsRoot>
    </main>
  );
}

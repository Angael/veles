import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { BarcodeIcon, SparklesIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { Label } from '@/components/ui/label/Label';
import { NumberInput } from '@/components/ui/number-input/NumberInput';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { calorieFoodQueryOptions, useLookupFoodByBarcodeMutation } from '../calories.query';
import { caloriesReturnState } from '../caloriesReturnScroll';
import { FoodBarcodeScanDialog } from '../foods/FoodBarcodeScanDialog';
import { useEnqueueFoodPhotoScanMutation } from './foodPhotoScans.query';
import { FOOD_PHOTO_SCAN_MAX_PHOTOS } from './foodPhotoScans.validation';
import { PhotoShots } from './PhotoShots';
import { usePhotoShots } from './usePhotoShots';
import css from './PhotoScanForm.module.css';

const barcodePattern = /^\d{6,14}$/;

type Props = {
  date: string;
  initialBarcode?: string;
  /** Asks for the eaten amount, because the user came here to log this product. */
  log: boolean;
  onDirty: () => void;
  onLeaving: () => void;
};

/**
 * Photos, barcode, amount, done. The page leaves at once: the log shows a pending row while
 * the upload and the worker's AI finish in the background.
 */
export function PhotoScanForm({ date, initialBarcode, log, onDirty, onLeaving }: Props) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const enqueueMutation = useEnqueueFoodPhotoScanMutation();
  const lookupMutation = useLookupFoodByBarcodeMutation();
  const { add, processing, remove, shots } = usePhotoShots(FOOD_PHOTO_SCAN_MAX_PHOTOS);
  const [barcode, setBarcode] = useState(initialBarcode ?? '');
  const [grams, setGrams] = useState<number | null>(null);
  const [scanning, setScanning] = useState(false);

  const knownFood =
    lookupMutation.data?.status === 'found' && lookupMutation.variables?.data.barcode === barcode
      ? lookupMutation.data.food
      : null;
  const ready = shots.length > 0 && processing === 0 && (!log || Boolean(grams));

  function lookup(value: string) {
    if (barcodePattern.test(value)) lookupMutation.mutate({ data: { barcode: value } });
  }

  function leave(search: { date: string; foodId?: string }) {
    onLeaving();
    void navigate({
      replace: true,
      search,
      state: caloriesReturnState(date),
      to: '/calories',
    });
  }

  function openKnownFood() {
    if (!knownFood) return;
    queryClient.setQueryData(calorieFoodQueryOptions(knownFood.id).queryKey, knownFood);
    leave({ date, foodId: knownFood.id });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const [cover] = shots;
    if (!ready || !cover) return;
    enqueueMutation.mutate({
      barcode: barcode || undefined,
      date,
      grams: log && grams ? Math.round(grams) : undefined,
      photos: shots.map((shot) => shot.file),
      // A separate URL, because this form releases its own previews when it unmounts.
      previewUrl: URL.createObjectURL(cover.file),
    });
    leave({ date });
  }

  return (
    <Card as='section'>
      <form className={css.form} onSubmit={submit}>
        <PhotoShots
          maxCount={FOOD_PHOTO_SCAN_MAX_PHOTOS}
          onAdd={(files) => {
            onDirty();
            void add(files);
          }}
          onRemove={remove}
          processing={processing}
          shots={shots}
        />
        <Label text={t({ en: 'Barcode (optional)', pl: 'Kod kreskowy (opcjonalnie)' })}>
          <TextInput
            inputMode='numeric'
            onBlur={() => lookup(barcode)}
            onValueChange={setBarcode}
            pattern='\d{6,14}'
            trailing={
              <Btn
                aria-label={t({ en: 'Scan barcode', pl: 'Skanuj kod kreskowy' })}
                icon={<BarcodeIcon aria-hidden='true' />}
                iconOnly
                onClick={() => setScanning(true)}
                size='sm'
                type='button'
                variant='ghost'
              />
            }
            value={barcode}
          />
        </Label>
        {knownFood ? (
          <div aria-live='polite' className={css.known}>
            <span>
              {t({
                en: `Already in products: ${knownFood.name}`,
                pl: `Już w produktach: ${knownFood.name}`,
              })}
            </span>
            <Btn onClick={openKnownFood} size='sm' type='button' variant='white'>
              {t({ en: 'Use it', pl: 'Użyj' })}
            </Btn>
          </div>
        ) : null}
        {log ? (
          <Label text={t({ en: 'Eaten amount (g)', pl: 'Zjedzona ilość (g)' })}>
            <NumberInput
              enterKeyHint='done'
              min={1}
              onValueChange={setGrams}
              required
              size='lg'
              stepperStep={1}
              value={grams}
            />
          </Label>
        ) : null}
        <Btn
          className={css.submit}
          disabled={!ready}
          icon={<SparklesIcon aria-hidden='true' />}
          type='submit'
        >
          {log
            ? t({ en: 'Add to log', pl: 'Dodaj do dziennika' })
            : t({ en: 'Create product', pl: 'Utwórz produkt' })}
        </Btn>
      </form>
      <FoodBarcodeScanDialog
        onOpenChange={setScanning}
        onScan={(scanned) => {
          setBarcode(scanned);
          setScanning(false);
          onDirty();
          lookup(scanned);
        }}
        open={scanning}
      />
    </Card>
  );
}

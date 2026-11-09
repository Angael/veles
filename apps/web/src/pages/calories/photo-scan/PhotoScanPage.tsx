import { useState } from 'react';
import { CameraIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { Label } from '@/components/ui/label/Label';
import { NumberInput } from '@/components/ui/number-input/NumberInput';
import { toastManager } from '@/components/ui/toast/toastManager';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { PhotoPicker, type PhotoPickerValue } from '../PhotoPicker';
import { useEnqueueFoodPhotoScanMutation } from './foodPhotoScans.query';
import { findPhotoBarcode, shrinkPhoto } from './photoScanFiles';
import css from './PhotoScanPage.module.css';

const emptyPhoto: PhotoPickerValue = { imageAction: 'keep' };

/**
 * Grams, front photo, optional label photo, send. The form resets at once so the user can
 * photograph the next product while the upload and the AI run in the background.
 */
export function PhotoScanPage({ date }: { date: string }) {
  const { formatWhole, t } = useI18n();
  const enqueueMutation = useEnqueueFoodPhotoScanMutation();
  const [grams, setGrams] = useState<number | null>(null);
  const [front, setFront] = useState<PhotoPickerValue>(emptyPhoto);
  const [label, setLabel] = useState<PhotoPickerValue>(emptyPhoto);
  const [sentCount, setSentCount] = useState(0);

  async function send(values: { front: File; grams: number; label?: File }) {
    const photos = [values.label, values.front].filter((photo): photo is File => Boolean(photo));
    const [barcode, frontPhoto, labelPhoto] = await Promise.all([
      findPhotoBarcode(photos),
      shrinkPhoto(values.front),
      values.label ? shrinkPhoto(values.label) : undefined,
    ]);
    const result = await enqueueMutation.mutateAsync({
      barcode,
      date,
      front: frontPhoto,
      grams: values.grams,
      label: labelPhoto,
    });
    if (result.status === 'logged') {
      toastManager.add({
        title: t({ en: `Logged ${result.name}`, pl: `Dodano ${result.name}` }),
        type: 'success',
      });
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!front.photo || !grams) return;
    void send({ front: front.photo, grams: Math.round(grams), label: label.photo }).catch(() => {
      // The mutation's error toast already tells the user.
    });
    setSentCount((count) => count + 1);
    setGrams(null);
    setFront(emptyPhoto);
    setLabel(emptyPhoto);
  }

  return (
    <main>
      <Card as='section'>
        <form className={css.form} onSubmit={submit}>
          <p className={css.hint}>
            {t({
              en: 'Photos are analyzed in the background. Products appear in your log when ready.',
              pl: 'Zdjęcia są analizowane w tle. Produkty pojawią się w dzienniku, gdy będą gotowe.',
            })}
          </p>
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
          <PhotoPicker
            legend={t({ en: 'Front of the package', pl: 'Przód opakowania' })}
            onChange={setFront}
            value={front}
          />
          <PhotoPicker
            legend={t({
              en: 'Nutrition label (skip for fruit and similar)',
              pl: 'Tabela wartości odżywczych (pomiń dla owoców itp.)',
            })}
            onChange={setLabel}
            value={label}
          />
          <div className={css.footer}>
            {sentCount > 0 ? (
              <span aria-live='polite' className={css.sent}>
                {t({
                  en: `Sent: ${formatWhole(sentCount)}`,
                  pl: `Wysłano: ${formatWhole(sentCount)}`,
                })}
              </span>
            ) : null}
            <Btn
              disabled={!front.photo || !grams}
              icon={<CameraIcon aria-hidden='true' />}
              type='submit'
            >
              {t({ en: 'Send and scan next', pl: 'Wyślij i skanuj dalej' })}
            </Btn>
          </div>
        </form>
      </Card>
    </main>
  );
}

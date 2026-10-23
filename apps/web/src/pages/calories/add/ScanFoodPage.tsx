import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { RouteBackButton } from '@/components/app/app-frame/RouteBackButton';
import { Btn } from '@/components/ui/btn/Btn';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { calorieFoodQueryOptions, useLookupFoodByBarcodeMutation } from '../calories.query';
import { BarcodeScanner } from '@/components/ui/barcode-scanner/BarcodeScanner';
import { LookupNotice } from '@/components/ui/barcode-scanner/LookupNotice';
import { useBarcodeLookup } from '@/components/ui/barcode-scanner/useBarcodeLookup';
import css from './ScanFoodPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

/** Camera-first barcode lookup; a match opens the Add food confirm step as a new history entry. */
export function ScanFoodPage({ initialDate: date }: { initialDate: string }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const lookupMutation = useLookupFoodByBarcodeMutation();
  const { dismiss, lookup, lookupBarcode } = useBarcodeLookup(async (barcode) => {
    const result = await lookupMutation.mutateAsync({ data: { barcode } });
    if (result.status !== 'found') return false;
    queryClient.setQueryData(calorieFoodQueryOptions(result.food.id).queryKey, result.food);
    await navigate({ search: { date, foodId: result.food.id }, to: '/calories/add' });
    return true;
  });

  return (
    <main className={css.scanPage}>
      <header className={css.header}>
        <RouteBackButton variant='ghost' />
        <h1>{t({ en: 'Scan barcode', pl: 'Zeskanuj kod kreskowy' })}</h1>
      </header>
      <BarcodeScanner
        notice={
          <LookupNotice
            lookup={lookup}
            notFoundAction={(barcode) => (
              <Btn isLink render={<Link search={{ barcode, date }} to='/calories/foods/new' />}>
                {t({ en: 'Add product', pl: 'Dodaj produkt' })}
              </Btn>
            )}
            onDismiss={dismiss}
            onRetry={(barcode) => void lookupBarcode(barcode)}
          />
        }
        onScan={(barcode) => void lookupBarcode(barcode)}
      />
      <TypedForm
        className={css.manualEntry}
        onSubmit={(data) => lookupBarcode(data.string('barcode'))}
      >
        <TextInput
          aria-label={t({ en: 'Enter barcode manually', pl: 'Wpisz kod kreskowy ręcznie' })}
          inputMode='numeric'
          name='barcode'
          placeholder={t({ en: 'Or type the barcode', pl: 'Lub wpisz kod kreskowy' })}
        />
        <Btn type='submit' variant='outlineMain'>
          {t({ en: 'Look up', pl: 'Szukaj' })}
        </Btn>
      </TypedForm>
    </main>
  );
}

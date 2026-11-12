import { BarcodeScanner } from '@/components/ui/barcode-scanner/BarcodeScanner';
import { Btn } from '@/components/ui/btn/Btn';
import {
  DialogActions,
  DialogClose,
  DialogPopup,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { useI18n } from '@/lib/i18n/I18nProvider';
import css from './FoodBarcodeScanDialog.module.css';

type Props = {
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
  open: boolean;
};

/** Reads a barcode for the food form. It does no product lookup; closing it reports nothing. */
export function FoodBarcodeScanDialog({ onOpenChange, onScan, open }: Props) {
  const { t } = useI18n();

  return (
    <DialogRoot onOpenChange={onOpenChange} open={open}>
      <DialogPopup className={css.popup}>
        <DialogTitle>{t({ en: 'Scan barcode', pl: 'Skanuj kod kreskowy' })}</DialogTitle>
        <div className={css.camera}>
          <BarcodeScanner onScan={onScan} />
        </div>
        <DialogActions>
          <DialogClose render={<Btn type='button' variant='ghost' />}>
            {t({ en: 'Cancel', pl: 'Anuluj' })}
          </DialogClose>
        </DialogActions>
      </DialogPopup>
    </DialogRoot>
  );
}

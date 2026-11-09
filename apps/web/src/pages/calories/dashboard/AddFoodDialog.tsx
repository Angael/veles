import { XIcon } from 'lucide-react';
import { type RefObject, useRef, useState } from 'react';
import type { CalorieFood } from '../calories.api';
import { SelectedFoodForm } from '../add/SelectedFoodForm';
import { Btn } from '@/components/ui/btn/Btn';
import { DialogClose, DialogPopup, DialogRoot, DialogTitle } from '@/components/ui/dialog/Dialog';
import css from './AddFoodDialog.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type Props = {
  date: string;
  finalFocus: RefObject<HTMLElement | null>;
  food: CalorieFood | null;
  onClose: () => void;
  onSaved: (date: string) => void;
};

/** Touch devices skip returning focus to the search, so its keyboard does not reopen. */
function hasCoarsePointer() {
  return window.matchMedia('(pointer: coarse)').matches;
}

/** Collects the amount for a picked food without leaving the diary; full height on phones. */
export function AddFoodDialog({ date, finalFocus, food, onClose, onSaved }: Props) {
  const { t } = useI18n();
  const amountInputRef = useRef<HTMLInputElement>(null);
  // Keep the last food rendered while the dialog animates out.
  const [shownFood, setShownFood] = useState(food);
  if (food && food !== shownFood) setShownFood(food);

  return (
    <DialogRoot
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      open={food !== null}
    >
      <DialogPopup
        className={css.popup}
        finalFocus={() => (hasCoarsePointer() ? false : finalFocus.current)}
        initialFocus={() => {
          const input = amountInputRef.current;
          // Base UI puts the caret at the end on first focus; select after it so typing replaces
          // the suggested amount.
          input?.addEventListener('focus', () => setTimeout(() => input.select()), { once: true });
          return input;
        }}
      >
        <header className={css.header}>
          <DialogTitle>{t({ en: 'Add food', pl: 'Dodaj jedzenie' })}</DialogTitle>
          <DialogClose
            render={
              <Btn
                aria-label={t({ en: 'Close', pl: 'Zamknij' })}
                icon={<XIcon aria-hidden='true' />}
                iconOnly
                size='sm'
                variant='ghost'
              />
            }
          />
        </header>
        {shownFood ? (
          <SelectedFoodForm
            amountInputRef={amountInputRef}
            food={shownFood}
            initialDate={date}
            key={shownFood.id}
            onSaved={onSaved}
          />
        ) : null}
      </DialogPopup>
    </DialogRoot>
  );
}

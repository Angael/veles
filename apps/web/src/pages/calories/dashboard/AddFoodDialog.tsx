import { XIcon } from 'lucide-react';
import { type RefObject, useState } from 'react';
import type { CalorieFood } from '../calories.api';
import { SelectedFoodForm } from '../add/SelectedFoodForm';
import { Btn } from '@/components/ui/btn/Btn';
import { DialogClose, DialogPopup, DialogRoot, DialogTitle } from '@/components/ui/dialog/Dialog';
import css from './AddFoodDialog.module.css';

type Props = {
  date: string;
  finalFocus: RefObject<HTMLElement | null>;
  food: CalorieFood | null;
  onClose: () => void;
  onSaved: (date: string) => void;
};

/** Collects the amount for a picked food without leaving the diary; full height on phones. */
export function AddFoodDialog({ date, finalFocus, food, onClose, onSaved }: Props) {
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
      <DialogPopup className={css.popup} finalFocus={finalFocus}>
        <header className={css.header}>
          <DialogTitle>Add food</DialogTitle>
          <DialogClose
            render={
              <Btn
                aria-label='Close'
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

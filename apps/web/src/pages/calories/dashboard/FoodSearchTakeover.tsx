import { Dialog } from '@base-ui/react/dialog';
import { ArrowLeftIcon, SearchIcon } from 'lucide-react';
import { type ComponentProps, useEffect, useRef, useState } from 'react';
import { FoodSearchCombobox, ScanButton } from './FoodSearchCombobox';
import { Btn } from '@/components/ui/btn/Btn';
import css from './FoodSearch.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type Props = Omit<ComponentProps<typeof FoodSearchCombobox>, 'inline' | 'inputRef'> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Tracks the height above the on-screen keyboard. Android Chrome overlays the keyboard without
 * resizing the layout, so a full-screen sheet would otherwise hide its last results under it.
 */
function useVisibleHeight(active: boolean) {
  const [height, setHeight] = useState<number | null>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!active || !viewport) return;
    const update = () => setHeight(viewport.height);
    update();
    viewport.addEventListener('resize', update);
    return () => viewport.removeEventListener('resize', update);
  }, [active]);
  return active ? height : null;
}

/**
 * Phone search: a field-shaped button opens a full-screen sheet with the input pinned on top.
 * The page underneath never scrolls, so the keyboard cannot shift the field or the results.
 */
export function FoodSearchTakeover({ open, onOpenChange, ...comboboxProps }: Props) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const visibleHeight = useVisibleHeight(open);
  const placeholder = t({
    en: 'Add food: banana, bread, yoghurt…',
    pl: 'Dodaj jedzenie: banan, chleb, jogurt…',
  });

  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <div className={css.trigger}>
        <Dialog.Trigger
          aria-label={t({ en: 'Search foods to log', pl: 'Szukaj jedzenia do dodania' })}
          className={css.triggerButton}
        >
          <SearchIcon aria-hidden='true' className={css.searchIcon} />
          <span>{placeholder}</span>
        </Dialog.Trigger>
        <div className={css.triggerScan}>
          <ScanButton date={comboboxProps.date} />
        </div>
      </div>

      <Dialog.Portal>
        <Dialog.Popup
          aria-label={t({ en: 'Search foods', pl: 'Szukaj jedzenia' })}
          className={css.takeover}
          finalFocus={false}
          initialFocus={inputRef}
          style={visibleHeight === null ? undefined : { height: visibleHeight }}
        >
          <Dialog.Close
            render={
              <Btn
                aria-label={t({ en: 'Back', pl: 'Wstecz' })}
                icon={<ArrowLeftIcon aria-hidden='true' />}
                iconOnly
                variant='ghost'
              />
            }
          />
          <FoodSearchCombobox {...comboboxProps} inline inputRef={inputRef} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

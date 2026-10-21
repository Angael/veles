import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Btn } from '@/components/ui/btn/Btn';
import {
  DialogActions,
  DialogClose,
  DialogPopup,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { useI18n } from '@/lib/i18n/I18nProvider';
import css from './MobileNavCustomizer.module.css';
import { MobileNavCustomizerRow } from './MobileNavCustomizerRow';
import { MOBILE_NAV_MAX_PINNED, type MobileNavPrefs, orderedNavbarItems } from './mobileNavPrefs';
import type { NavbarItemKey } from './navbarItems';

type MobileNavCustomizerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefs: MobileNavPrefs;
  onPrefsChange: (prefs: MobileNavPrefs | null) => void;
};

/**
 * Bottom sheet that edits the phone dock: drag rows to reorder and switch sections into the bar
 * (up to the max). Changes save at once to a cookie; More always stays so nothing is lost.
 */
export function MobileNavCustomizer({
  open,
  onOpenChange,
  prefs,
  onPrefsChange,
}: MobileNavCustomizerProps) {
  const { t } = useI18n();
  const items = orderedNavbarItems(prefs);
  const full = prefs.pinned.length >= MOBILE_NAV_MAX_PINNED;
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const from = prefs.order.findIndex((key) => key === active.id);
    const to = prefs.order.findIndex((key) => key === over?.id);
    if (from !== -1 && to !== -1 && from !== to) {
      onPrefsChange({ ...prefs, order: arrayMove(prefs.order, from, to) });
    }
  };

  const setPinned = (key: NavbarItemKey, pinned: boolean) => {
    onPrefsChange({
      ...prefs,
      pinned: pinned ? [...prefs.pinned, key] : prefs.pinned.filter((k) => k !== key),
    });
  };

  return (
    <DialogRoot onOpenChange={onOpenChange} open={open}>
      <DialogPopup className={css.sheet}>
        <DialogTitle>{t({ en: 'Bottom bar', pl: 'Dolny pasek' })}</DialogTitle>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
          <SortableContext items={prefs.order} strategy={verticalListSortingStrategy}>
            <ul className={css.list}>
              {items.map((item) => (
                <MobileNavCustomizerRow
                  full={full}
                  item={item}
                  key={item.key}
                  onPinnedChange={(pinned) => setPinned(item.key, pinned)}
                  pinned={prefs.pinned.includes(item.key)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
        <DialogActions>
          <Btn onClick={() => onPrefsChange(null)} variant='ghost'>
            {t({ en: 'Reset', pl: 'Przywróć domyślne' })}
          </Btn>
          <DialogClose render={<Btn>{t({ en: 'Done', pl: 'Gotowe' })}</Btn>} />
        </DialogActions>
      </DialogPopup>
    </DialogRoot>
  );
}

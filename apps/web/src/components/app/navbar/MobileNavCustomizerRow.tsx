import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVerticalIcon } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle/Toggle';
import { useI18n } from '@/lib/i18n/I18nProvider';
import css from './MobileNavCustomizer.module.css';
import type { NavbarItem } from './navbarItems';

type MobileNavCustomizerRowProps = {
  item: NavbarItem;
  pinned: boolean;
  /** No free slot left in the bar, so an unpinned row cannot switch on. */
  full: boolean;
  onPinnedChange: (pinned: boolean) => void;
};

/** One sortable section row: drag handle, icon, label, and the show-in-bar switch. */
export function MobileNavCustomizerRow({
  item,
  pinned,
  full,
  onPinnedChange,
}: MobileNavCustomizerRowProps) {
  const { t } = useI18n();
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.key,
  });
  const Icon = item.icon;
  const label = t(item.label);

  return (
    <li
      className={css.row}
      data-dragging={isDragging || undefined}
      data-pinned={pinned || undefined}
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <button
        className={css.handle}
        type='button'
        {...attributes}
        {...listeners}
        aria-label={t({ en: `Reorder ${label}`, pl: `Zmień kolejność: ${label}` })}
      >
        <GripVerticalIcon aria-hidden='true' size={18} />
      </button>
      <span aria-hidden='true' className={css.icon}>
        <Icon size={20} strokeWidth={1.9} />
      </span>
      <span className={css.label}>{label}</span>
      <Toggle
        aria-label={t({ en: `Show ${label} in the bar`, pl: `Pokaż ${label} na pasku` })}
        checked={pinned}
        disabled={!pinned && full}
        onCheckedChange={onPinnedChange}
      />
    </li>
  );
}

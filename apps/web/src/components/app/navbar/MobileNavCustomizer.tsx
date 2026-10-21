import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import {
  DialogActions,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { Toggle } from '@/components/ui/toggle/Toggle';
import { useI18n } from '@/lib/i18n/I18nProvider';
import css from './MobileNavCustomizer.module.css';
import {
  MOBILE_NAV_MAX_PINNED,
  type MobileNavPrefs,
  orderedNavbarItems,
  saveMobileNavPrefs,
} from './mobileNavPrefs';
import type { NavbarItemKey } from './navbarItems';

type MobileNavCustomizerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefs: MobileNavPrefs;
};

/**
 * Bottom sheet that edits the phone dock: switch a section into the bar (up to the max) and move
 * it up or down. Changes save at once on this device; More always stays so nothing is lost.
 */
export function MobileNavCustomizer({ open, onOpenChange, prefs }: MobileNavCustomizerProps) {
  const { t } = useI18n();
  const items = orderedNavbarItems(prefs);
  const full = prefs.pinned.length >= MOBILE_NAV_MAX_PINNED;

  const move = (key: NavbarItemKey, offset: -1 | 1) => {
    const order = prefs.order.filter((k) => k !== key);
    order.splice(prefs.order.indexOf(key) + offset, 0, key);
    saveMobileNavPrefs({ ...prefs, order });
  };

  const setPinned = (key: NavbarItemKey, pinned: boolean) => {
    saveMobileNavPrefs({
      ...prefs,
      pinned: pinned ? [...prefs.pinned, key] : prefs.pinned.filter((k) => k !== key),
    });
  };

  return (
    <DialogRoot onOpenChange={onOpenChange} open={open}>
      <DialogPopup className={css.sheet}>
        <DialogTitle>{t({ en: 'Customize bottom bar', pl: 'Dostosuj dolny pasek' })}</DialogTitle>
        <DialogDescription>
          {t({
            en: `Show up to ${MOBILE_NAV_MAX_PINNED} sections in the bar. The rest stay under More.`,
            pl: `Pokaż do ${MOBILE_NAV_MAX_PINNED} sekcji na pasku. Reszta zostaje w menu Więcej.`,
          })}
        </DialogDescription>
        <ul className={css.list}>
          {items.map((item, index) => {
            const Icon = item.icon;
            const label = t(item.label);
            const pinned = prefs.pinned.includes(item.key);
            return (
              <li className={css.row} data-pinned={pinned || undefined} key={item.key}>
                <span aria-hidden='true' className={css.icon}>
                  <Icon size={20} strokeWidth={1.9} />
                </span>
                <span className={css.label}>{label}</span>
                <Btn
                  aria-label={t({ en: `Move ${label} up`, pl: `Przesuń ${label} w górę` })}
                  disabled={index === 0}
                  icon={<ArrowUpIcon aria-hidden='true' size={18} />}
                  iconOnly
                  onClick={() => move(item.key, -1)}
                  radius='pill'
                  variant='ghost'
                />
                <Btn
                  aria-label={t({ en: `Move ${label} down`, pl: `Przesuń ${label} w dół` })}
                  disabled={index === items.length - 1}
                  icon={<ArrowDownIcon aria-hidden='true' size={18} />}
                  iconOnly
                  onClick={() => move(item.key, 1)}
                  radius='pill'
                  variant='ghost'
                />
                <Toggle
                  aria-label={t({ en: `Show ${label} in the bar`, pl: `Pokaż ${label} na pasku` })}
                  checked={pinned}
                  disabled={!pinned && full}
                  onCheckedChange={(checked) => setPinned(item.key, checked)}
                />
              </li>
            );
          })}
        </ul>
        <DialogActions>
          <Btn onClick={() => saveMobileNavPrefs(null)} variant='ghost'>
            {t({ en: 'Reset', pl: 'Przywróć domyślne' })}
          </Btn>
          <DialogClose render={<Btn>{t({ en: 'Done', pl: 'Gotowe' })}</Btn>} />
        </DialogActions>
      </DialogPopup>
    </DialogRoot>
  );
}

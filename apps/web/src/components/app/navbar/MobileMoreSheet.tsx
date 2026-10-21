import { Link } from '@tanstack/react-router';
import { LayoutGridIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import {
  DialogClose,
  DialogPopup,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog/Dialog';
import { useI18n } from '@/lib/i18n/I18nProvider';
import css from './MobileMoreSheet.module.css';
import dockCss from './MobileNavbar.module.css';
import {
  isNavbarItemActive,
  MOBILE_DOCK_ITEM_KEYS,
  MOBILE_DOCK_ITEMS,
  NAVBAR_ITEMS,
} from './navbarItems';

const SECONDARY_ITEMS = NAVBAR_ITEMS.filter((item) => !MOBILE_DOCK_ITEM_KEYS.includes(item.key));
/** Dock tabs first, then the rest in desktop order, so the sheet mirrors the dock above it. */
const SHEET_ITEMS = [...MOBILE_DOCK_ITEMS, ...SECONDARY_ITEMS];

/**
 * More dock tab and its bottom sheet listing every section. The tab looks current while a
 * destination outside the dock is open, and the sheet closes on any route change so browser
 * back or a same-page link never leaves it stranded open.
 */
export function MobileMoreSheet({ pathname }: { pathname: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  if (openedAt !== pathname) {
    setOpenedAt(pathname);
    setOpen(false);
  }

  const secondaryActive = SECONDARY_ITEMS.find((item) => isNavbarItemActive(item, pathname));
  const moreLabel = t({ en: 'More', pl: 'Więcej' });
  const currentLabel = t({ en: 'You are here', pl: 'Jesteś tutaj' });

  return (
    <DialogRoot onOpenChange={setOpen} open={open}>
      <DialogTrigger
        aria-label={
          secondaryActive
            ? t({
                en: `${moreLabel}, current page: ${t(secondaryActive.label)}`,
                pl: `${moreLabel}, bieżąca strona: ${t(secondaryActive.label)}`,
              })
            : undefined
        }
        className={dockCss.item}
        data-current={secondaryActive ? '' : undefined}
      >
        <LayoutGridIcon aria-hidden='true' className={dockCss.icon} size={20} strokeWidth={1.9} />
        <span className={dockCss.label}>{moreLabel}</span>
      </DialogTrigger>
      <DialogPopup className={css.sheet}>
        <div className={css.header}>
          <DialogTitle className={css.title}>
            {t({ en: 'All sections', pl: 'Wszystkie sekcje' })}
          </DialogTitle>
          <DialogClose
            render={
              <Btn
                aria-label={t({ en: 'Close', pl: 'Zamknij' })}
                icon={<XIcon aria-hidden='true' size={18} strokeWidth={1.9} />}
                iconOnly
                radius='pill'
                variant='ghost'
              />
            }
          />
        </div>
        <ul className={css.list}>
          {SHEET_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isNavbarItemActive(item, pathname);
            return (
              <li key={item.key}>
                <Link className={css.row} onClick={() => setOpen(false)} to={item.link}>
                  <span aria-hidden='true' className={css.rowIcon}>
                    <Icon size={20} strokeWidth={1.9} />
                  </span>
                  <span className={css.rowText}>
                    <span className={css.rowLabel}>{t(item.label)}</span>
                    <span className={css.rowDescription}>{t(item.description)}</span>
                  </span>
                  {active ? (
                    // `aria-current` on the link already announces this to assistive tech.
                    <span aria-hidden='true' className={css.currentTag}>
                      {currentLabel}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </DialogPopup>
    </DialogRoot>
  );
}

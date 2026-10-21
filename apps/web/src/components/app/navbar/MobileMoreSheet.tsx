import { Link } from '@tanstack/react-router';
import { LayoutGridIcon, SlidersHorizontalIcon, XIcon } from 'lucide-react';
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
import { isNavbarItemActive, type NavbarItem } from './navbarItems';

type MobileMoreSheetProps = {
  /** Every section in the user's order. */
  items: NavbarItem[];
  /** Sections not pinned to the dock; More looks current while one of them is open. */
  hiddenItems: NavbarItem[];
  onCustomize: () => void;
  pathname: string;
};

/**
 * More dock tab and its bottom sheet listing every section, plus the button that opens dock
 * customization. The sheet closes on any route change so browser back never leaves it open.
 */
export function MobileMoreSheet({
  items,
  hiddenItems,
  onCustomize,
  pathname,
}: MobileMoreSheetProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  if (openedAt !== pathname) {
    setOpenedAt(pathname);
    setOpen(false);
  }

  const hiddenActive = hiddenItems.find((item) => isNavbarItemActive(item, pathname));
  const moreLabel = t({ en: 'More', pl: 'Więcej' });

  return (
    <DialogRoot onOpenChange={setOpen} open={open}>
      <DialogTrigger
        aria-label={
          hiddenActive
            ? t({
                en: `${moreLabel}, current page: ${t(hiddenActive.label)}`,
                pl: `${moreLabel}, bieżąca strona: ${t(hiddenActive.label)}`,
              })
            : undefined
        }
        className={dockCss.item}
        data-active={hiddenActive ? '' : undefined}
      >
        <span aria-hidden='true' className={dockCss.indicator}>
          <LayoutGridIcon size={20} strokeWidth={1.9} />
        </span>
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
          {items.map((item) => {
            const Icon = item.icon;
            const active = isNavbarItemActive(item, pathname);
            return (
              <li key={item.key}>
                <Link
                  aria-current={active ? 'page' : undefined}
                  className={css.row}
                  onClick={() => setOpen(false)}
                  to={item.link}
                >
                  <span aria-hidden='true' className={css.rowIcon}>
                    <Icon size={20} strokeWidth={1.9} />
                  </span>
                  <span className={css.rowText}>
                    <span className={css.rowLabel}>{t(item.label)}</span>
                    <span className={css.rowDescription}>{t(item.description)}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <Btn
          icon={<SlidersHorizontalIcon aria-hidden='true' size={18} strokeWidth={1.9} />}
          onClick={() => {
            setOpen(false);
            onCustomize();
          }}
          variant='ghost'
        >
          {t({ en: 'Customize bottom bar', pl: 'Dostosuj dolny pasek' })}
        </Btn>
      </DialogPopup>
    </DialogRoot>
  );
}

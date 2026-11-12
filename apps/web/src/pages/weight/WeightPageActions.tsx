import { useNavigate } from '@tanstack/react-router';
import { CalendarPlusIcon, EllipsisIcon, FileUpIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { MenuBtn, MenuBtnItem, MenuBtnPopup, MenuBtnRoot } from '@/components/ui/menu-btn/MenuBtn';
import { useI18n } from '@/lib/i18n/I18nProvider';

/** Rare weight actions in the page header, so daily logging keeps the space under the chart. */
export function WeightPageActions() {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <MenuBtnRoot>
      <Btn
        aria-label={t({ en: 'More weight actions', pl: 'Więcej akcji wagi' })}
        icon={<EllipsisIcon aria-hidden='true' />}
        iconOnly
        radius='pill'
        render={<MenuBtn />}
        size='sm'
        variant='ghost'
      />
      <MenuBtnPopup
        aria-label={t({ en: 'Weight actions', pl: 'Akcje wagi' })}
        heading={t({ en: 'Weight', pl: 'Waga' })}
      >
        <MenuBtnItem
          description={t({
            en: 'Backfill a missed day, with photos',
            pl: 'Uzupełnij pominięty dzień, ze zdjęciami',
          })}
          icon={<CalendarPlusIcon aria-hidden='true' />}
          label={t({ en: 'Add for another date', pl: 'Dodaj dla innej daty' })}
          onClick={() => void navigate({ to: '/weight/add' })}
        />
        <MenuBtnItem
          description={t({
            en: 'Paste history from another app',
            pl: 'Wklej historię z innej aplikacji',
          })}
          icon={<FileUpIcon aria-hidden='true' />}
          label={t({ en: 'Import', pl: 'Importuj' })}
          onClick={() => void navigate({ to: '/weight/import' })}
        />
      </MenuBtnPopup>
    </MenuBtnRoot>
  );
}

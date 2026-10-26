import { Link } from '@tanstack/react-router';
import { AppleIcon, PlusIcon, ScanLineIcon, SparklesIcon } from 'lucide-react';
import { FloatingButton } from '@/components/ui/floating-button/FloatingButton';
import {
  MenuBtn,
  MenuBtnChevron,
  MenuBtnDivider,
  MenuBtnItem,
  MenuBtnPopup,
  MenuBtnRoot,
} from '@/components/ui/menu-btn/MenuBtn';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { Localized } from '@/lib/i18n/locale';

type Props = { date: string };

const loggingActions = [
  {
    description: {
      en: 'Use the camera or enter a barcode',
      pl: 'Użyj kamery lub wpisz kod kreskowy',
    },
    icon: ScanLineIcon,
    label: { en: 'Scan barcode', pl: 'Skanuj kod kreskowy' },
    to: '/calories/scan' as const,
  },
  {
    description: {
      en: 'Enter calories and macros directly',
      pl: 'Wpisz kalorie i makroskładniki bezpośrednio',
    },
    icon: SparklesIcon,
    label: { en: 'Quick add', pl: 'Szybkie dodawanie' },
    to: '/calories/quick-add' as const,
  },
] satisfies Array<{ description: Localized; label: Localized; [key: string]: unknown }>;

export function LogFoodMenu({ date }: Props) {
  const { t } = useI18n();
  const logFood = t({ en: 'Log food', pl: 'Dodaj wpis' });

  return (
    <MenuBtnRoot>
      <FloatingButton icon={<PlusIcon aria-hidden='true' />} render={<MenuBtn openOnHover />}>
        {logFood}
        <MenuBtnChevron />
      </FloatingButton>
      <MenuBtnPopup
        aria-label={logFood}
        description={t({
          en: 'Choose how you want to add this entry.',
          pl: 'Wybierz, jak chcesz dodać ten wpis.',
        })}
        heading={logFood}
      >
        {loggingActions.map((action) => {
          const ActionIcon = action.icon;
          return (
            <MenuBtnItem
              description={t(action.description)}
              icon={<ActionIcon aria-hidden='true' />}
              key={action.to}
              label={t(action.label)}
              render={<Link search={{ date }} to={action.to} />}
            />
          );
        })}
        <MenuBtnDivider />
        <MenuBtnItem
          description={t({
            en: 'Save nutrition details for reuse',
            pl: 'Zapisz wartości odżywcze do ponownego użycia',
          })}
          icon={<AppleIcon aria-hidden='true' />}
          label={t({ en: 'Create a new food', pl: 'Utwórz nowy produkt' })}
          render={<Link search={{ date }} to='/calories/foods/new' />}
        />
      </MenuBtnPopup>
    </MenuBtnRoot>
  );
}

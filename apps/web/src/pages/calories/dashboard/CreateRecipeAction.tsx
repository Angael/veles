import { Link } from '@tanstack/react-router';
import { ChefHatIcon } from 'lucide-react';
import type { CalorieLog } from '../calories.api';
import { SelectionBarAction } from '@/components/ui/selection-bar/SelectionBar';
import { useI18n } from '@/lib/i18n/I18nProvider';

/** Selection bar action opening a new recipe prefilled from the selected logs; logs stay as they are. */
export function CreateRecipeAction({ logs }: { logs: CalorieLog[] }) {
  const { t } = useI18n();

  return (
    <SelectionBarAction
      icon={<ChefHatIcon aria-hidden='true' />}
      isLink
      label={t({ en: 'Create recipe', pl: 'Utwórz przepis' })}
      phoneLabel={t({ en: 'Recipe', pl: 'Przepis' })}
      render={<Link search={{ fromLogs: logs.map((entry) => entry.id) }} to='/recipes/add' />}
    />
  );
}

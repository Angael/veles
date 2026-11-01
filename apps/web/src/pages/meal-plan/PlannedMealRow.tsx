import { Link } from '@tanstack/react-router';
import {
  CookingPotIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  SparklesIcon,
  Trash2Icon,
} from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { ListItem } from '@/components/ui/list/List';
import {
  MenuBtn,
  MenuBtnDivider,
  MenuBtnItem,
  MenuBtnPopup,
  MenuBtnRoot,
} from '@/components/ui/menu-btn/MenuBtn';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { pluralEn } from '@/lib/i18n/locale';
import { useDeleteMealPlanItemMutation } from './mealPlan.query';
import { estimateMeal, type MealPlanItem, mealName, mealQuickAddSearch } from './mealPlanEstimate';
import css from './MealPlanPage.module.css';

type Props = { item: MealPlanItem; onEdit: () => void; today: string };

/** A planned meal with its estimate; logging it opens a prefilled quick add instead of writing a log. */
export function PlannedMealRow({ item, onEdit, today }: Props) {
  const { formatNumber, t } = useI18n();
  const deleteMutation = useDeleteMealPlanItemMutation();
  const name = mealName(item);
  const estimate = estimateMeal(item);
  const canLog = item.date <= today;
  const details: string[] = [];
  if (item.recipe) {
    details.push(
      t({
        en: `${formatNumber(item.portions)} ${pluralEn(item.portions, 'portion', 'portions')}`,
        pl: `Porcje: ${formatNumber(item.portions)}`,
      }),
      estimate
        ? `≈ ${formatNumber(Math.round(estimate.kcal))} kcal`
        : t({ en: 'No nutrition in recipe', pl: 'Przepis bez wartości' }),
    );
  }

  return (
    <ListItem className={css.meal}>
      <button className={css.mealMain} onClick={onEdit} type='button'>
        {item.recipe ? (
          <CookingPotIcon
            aria-label={t({ en: 'Recipe', pl: 'Przepis' })}
            className={css.mealIcon}
          />
        ) : null}
        <span className={css.mealText}>
          <strong>{name}</strong>
          {details.length ? <small>{details.join(' · ')}</small> : null}
        </span>
      </button>

      <MenuBtnRoot>
        <Btn
          aria-label={t({ en: `Actions for ${name}`, pl: `Akcje: ${name}` })}
          icon={<EllipsisVerticalIcon aria-hidden='true' />}
          iconOnly
          loading={deleteMutation.isPending}
          render={<MenuBtn />}
          size='sm'
          variant='ghost'
        />
        <MenuBtnPopup aria-label={name} heading={name}>
          <MenuBtnItem
            description={
              canLog
                ? t({ en: 'Review and add it to the food log', pl: 'Sprawdź i dodaj do dziennika' })
                : t({ en: 'Available on the planned day', pl: 'Dostępne w zaplanowanym dniu' })
            }
            disabled={!canLog}
            icon={<SparklesIcon aria-hidden='true' />}
            label={t({ en: 'Log as eaten', pl: 'Zapisz jako zjedzone' })}
            render={
              canLog ? (
                <Link search={mealQuickAddSearch(item)} to='/calories/quick-add' />
              ) : undefined
            }
          />
          {item.recipe ? (
            <MenuBtnItem
              icon={<CookingPotIcon aria-hidden='true' />}
              label={t({ en: 'Open recipe', pl: 'Otwórz przepis' })}
              render={<Link params={{ id: item.recipe.id }} to='/recipes/view/$id' />}
            />
          ) : null}
          <MenuBtnItem
            icon={<PencilIcon aria-hidden='true' />}
            label={t({ en: 'Edit or move', pl: 'Edytuj lub przenieś' })}
            onClick={onEdit}
          />
          <MenuBtnDivider />
          <MenuBtnItem
            icon={<Trash2Icon aria-hidden='true' />}
            label={t({ en: 'Delete', pl: 'Usuń' })}
            onClick={() => deleteMutation.mutate(item.id)}
          />
        </MenuBtnPopup>
      </MenuBtnRoot>
    </ListItem>
  );
}

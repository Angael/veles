import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { DateInput } from '@/components/ui/date-input/DateInput';
import {
  DialogActions,
  DialogClose,
  DialogPopup,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { Label } from '@/components/ui/label/Label';
import { NumberInput } from '@/components/ui/number-input/NumberInput';
import { SelectInput } from '@/components/ui/select-input/SelectInput';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { toastManager } from '@/components/ui/toast/toastManager';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { pluralEn, pluralPl } from '@/lib/i18n/locale';
import { useSaveMealPlanItemMutation } from './mealPlan.query';
import { MAX_PLANNED_PORTIONS } from './mealPlan.validation';
import { estimateMeal, type MealPlanItem, type PlannedRecipe } from './mealPlanEstimate';
import css from './MealPlanPage.module.css';

const NO_RECIPE = 'none';

type Props = {
  date: string;
  item: MealPlanItem | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  recipes: PlannedRecipe[];
};

export function MealPlanItemDialog({ date, item, onOpenChange, open, recipes }: Props) {
  const { t } = useI18n();

  return (
    <DialogRoot onOpenChange={onOpenChange} open={open}>
      <DialogPopup>
        <DialogTitle>
          {item
            ? t({ en: 'Edit planned meal', pl: 'Edytuj zaplanowany posiłek' })
            : t({ en: 'Plan a meal', pl: 'Zaplanuj posiłek' })}
        </DialogTitle>
        <MealPlanItemForm
          date={date}
          item={item}
          onSaved={() => onOpenChange(false)}
          recipes={recipes}
        />
      </DialogPopup>
    </DialogRoot>
  );
}

type FormProps = Omit<Props, 'onOpenChange' | 'open'> & { onSaved: () => void };

/**
 * Mounts with the popup so fields start from the edited meal. A meal is either one of the user's
 * recipes with a portion count, or a free-text name; the date field moves it to another day.
 */
function MealPlanItemForm({ date, item, onSaved, recipes }: FormProps) {
  const { formatDate, formatNumber, t } = useI18n();
  const saveMutation = useSaveMealPlanItemMutation();
  const [recipeId, setRecipeId] = useState(item?.recipe?.id ?? NO_RECIPE);
  const [name, setName] = useState(item && !item.recipe ? item.name : '');
  const [portions, setPortions] = useState<number | null>(item?.portions ?? 1);
  const [plannedDate, setPlannedDate] = useState(item?.date ?? date);
  const recipe = recipes.find((entry) => entry.id === recipeId) ?? null;
  const estimate = recipe && portions ? estimateMeal({ portions, recipe }) : null;
  const valid =
    Boolean(plannedDate) &&
    (recipe
      ? portions !== null && portions > 0 && portions <= MAX_PLANNED_PORTIONS
      : name.trim() !== '');
  const recipeItems = [
    {
      label: t({ en: 'No recipe, just a name', pl: 'Bez przepisu, tylko nazwa' }),
      value: NO_RECIPE,
    },
    ...recipes.map((entry) => ({ label: entry.name, value: entry.id })),
  ];

  function submit() {
    if (!valid || saveMutation.isPending) return;
    saveMutation.mutate(
      {
        ...(item ? { id: item.id } : {}),
        date: plannedDate,
        recipeId: recipe?.id ?? null,
        name: recipe ? recipe.name : name.trim(),
        portions: recipe && portions ? portions : 1,
      },
      {
        onSuccess: () => {
          if (item && item.date !== plannedDate) {
            const day = formatDate(plannedDate, {
              day: 'numeric',
              month: 'short',
              weekday: 'short',
            });
            toastManager.add({
              title: t({ en: `Moved to ${day}`, pl: `Przeniesiono na ${day}` }),
              type: 'success',
            });
          }
          onSaved();
        },
      },
    );
  }

  return (
    <form
      className={css.form}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {recipes.length ? (
        <Label text={t({ en: 'Recipe', pl: 'Przepis' })}>
          <SelectInput
            items={recipeItems}
            onValueChange={(value) => setRecipeId(value ?? NO_RECIPE)}
            value={recipeId}
          />
        </Label>
      ) : null}

      {recipe ? (
        <>
          <Label text={t({ en: 'Portions', pl: 'Porcje' })}>
            <NumberInput
              max={MAX_PLANNED_PORTIONS}
              min={0.25}
              onValueChange={setPortions}
              stepperStep={0.5}
              value={portions}
            />
          </Label>
          <p className={css.formEstimate}>
            {estimate
              ? t({
                  en: `Estimated ${formatNumber(Math.round(estimate.kcal))} kcal of ${formatNumber(recipe.portions)} recipe ${pluralEn(recipe.portions, 'portion', 'portions')}.`,
                  pl: `Szacunkowo ${formatNumber(Math.round(estimate.kcal))} kcal (przepis na ${formatNumber(recipe.portions)} ${pluralPl(recipe.portions, 'porcję', 'porcje', 'porcji')}).`,
                })
              : t({
                  en: 'This recipe has no calories yet, so the day total will be incomplete.',
                  pl: 'Ten przepis nie ma jeszcze kalorii, więc suma dnia będzie niepełna.',
                })}
          </p>
        </>
      ) : (
        <Label text={t({ en: 'Meal', pl: 'Posiłek' })}>
          <TextInput
            autoFocus={!item}
            maxLength={200}
            onValueChange={setName}
            placeholder={t({ en: 'e.g. Leftover soup', pl: 'np. Zupa z wczoraj' })}
            required
            value={name}
          />
        </Label>
      )}

      <Label text={t({ en: 'Date', pl: 'Data' })}>
        <DateInput onValueChange={setPlannedDate} required value={plannedDate} />
      </Label>

      <DialogActions>
        <DialogClose render={<Btn type='button' variant='ghost' />}>
          {t({ en: 'Cancel', pl: 'Anuluj' })}
        </DialogClose>
        <Btn disabled={!valid} loading={saveMutation.isPending} type='submit'>
          {item ? t({ en: 'Save', pl: 'Zapisz' }) : t({ en: 'Add to plan', pl: 'Dodaj do planu' })}
        </Btn>
      </DialogActions>
    </form>
  );
}

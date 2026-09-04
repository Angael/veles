import type { UseNavigateResult } from '@tanstack/react-router';
import type { CalorieGoal } from '../calories.api';
import { useSetDailyCalorieGoalMutation } from '../calories.query';
import { todayLocalDate } from '../calorieHelpers';
import { Btn } from '@/components/btn/Btn';
import { KcalMacrosForm } from '@/components/kcal-macros-form/KcalMacrosForm';
import { TypedForm } from '@/components/typed-form/TypedForm';
import { TypedFormData } from '@/lib/typedFormData';
import css from '../CalorieFlows.module.css';

export function CalorieGoalsPage({ goal }: { goal: CalorieGoal | null }) {
  const goalMutation = useSetDailyCalorieGoalMutation();
  async function submit(formData: TypedFormData, navigate: UseNavigateResult<string>) {
    const date = todayLocalDate();
    await goalMutation.mutateAsync({
      date,
      kcal: formData.number('kcal'),
      protein: formData.optionalNumber('protein'),
      fat: formData.optionalNumber('fat'),
      carbs: formData.optionalNumber('carbs'),
    });
    await navigate({ to: '/calories', search: { date } });
  }
  return (
    <main className={css.page}>
      <header className={css.header}>
        <div>
          <h1>Current goals</h1>
          <p>Changes start today. Earlier goals stay frozen.</p>
        </div>
      </header>
      <section className={css.panel}>
        <TypedForm className={css.form} onSubmit={submit}>
          <KcalMacrosForm
            defaultValues={{
              kcal: goal?.kcal,
              protein: goal?.protein,
              fat: goal?.fat,
              carbs: goal?.carbs,
            }}
            kcalInput={{ min: 1, step: 10 }}
          />

          <Btn loading={goalMutation.isPending} type='submit'>
            Save current goals
          </Btn>
        </TypedForm>
      </section>
    </main>
  );
}

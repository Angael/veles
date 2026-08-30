import { useNavigate } from '@tanstack/react-router';
import type { FormEvent } from 'react';
import type { CalorieGoal } from '../calories.api';
import { useSetDailyCalorieGoalMutation } from '../calories.query';
import { todayLocalDate } from '../calorieHelpers';
import { Btn } from '@/components/btn/Btn';
import { KcalMacrosForm } from '@/components/kcal-macros-form/KcalMacrosForm';
import { TypedFormData } from '@/lib/formData';
import css from '../CalorieFlows.module.css';

export function CalorieGoalsPage({ goal }: { goal: CalorieGoal | null }) {
  const navigate = useNavigate();
  const goalMutation = useSetDailyCalorieGoalMutation();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new TypedFormData(event.currentTarget);
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
        <form className={css.form} onSubmit={(event) => void submit(event)}>
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
        </form>
      </section>
    </main>
  );
}

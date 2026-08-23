import { useNavigate } from '@tanstack/react-router';
import type { FormEvent } from 'react';
import type { CalorieGoal } from '../calories.api';
import { useSetDailyCalorieGoalMutation } from '../calories.query';
import { todayLocalDate } from '../calorieHelpers';
import { Btn } from '@/components/btn/Btn';
import { Label } from '@/components/label/Label';
import { NumberInput } from '@/components/number-input/NumberInput';
import css from '../CalorieFlows.module.css';

export function CalorieGoalsPage({ goal }: { goal: CalorieGoal | null }) {
  const navigate = useNavigate();
  const goalMutation = useSetDailyCalorieGoalMutation();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const optional = (key: string) => {
      const value = String(data.get(key) ?? '').trim();
      return value ? Number(value) : undefined;
    };
    const date = todayLocalDate();
    await goalMutation.mutateAsync({
      date,
      kcal: Number(data.get('kcal')),
      protein: optional('protein'),
      fat: optional('fat'),
      carbs: optional('carbs'),
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
          <div className={css.grid}>
            <Label text='Daily kcal'>
              <NumberInput
                defaultValue={goal?.kcal ?? undefined}
                min={1}
                name='kcal'
                required
                step={10}
              />
            </Label>
            <Label text='Protein (g)'>
              <NumberInput
                defaultValue={goal?.protein ?? undefined}
                min={0}
                name='protein'
                step={1}
              />
            </Label>
            <Label text='Fat (g)'>
              <NumberInput defaultValue={goal?.fat ?? undefined} min={0} name='fat' step={1} />
            </Label>
            <Label text='Carbs (g)'>
              <NumberInput defaultValue={goal?.carbs ?? undefined} min={0} name='carbs' step={1} />
            </Label>
          </div>

          <Btn loading={goalMutation.isPending} type='submit'>
            Save current goals
          </Btn>
        </form>
      </section>
    </main>
  );
}

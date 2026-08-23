import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import type { FormEvent } from 'react';
import { useState } from 'react';
import type { CalorieGoal } from '../calories.api';
import { setDailyCalorieGoal } from './goals.api';
import { invalidateAllCalorieWeeks } from '../calorieQueries';
import { todayLocalDate } from '../calorieHelpers';
import { Btn } from '@/components/btn/Btn';
import { Label } from '@/components/label/Label';
import { NumberInput } from '@/components/number-input/NumberInput';
import css from '../CalorieFlows.module.css';

export function CalorieGoalsPage({ goal }: { goal: CalorieGoal | null }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const data = new FormData(event.currentTarget);
    const optional = (key: string) => {
      const value = String(data.get(key) ?? '').trim();
      return value ? Number(value) : undefined;
    };
    try {
      await setDailyCalorieGoal({
        data: {
          date: todayLocalDate(),
          kcal: Number(data.get('kcal')),
          protein: optional('protein'),
          fat: optional('fat'),
          carbs: optional('carbs'),
        },
      });
      await invalidateAllCalorieWeeks(queryClient);
      await navigate({ to: '/calories', search: { date: todayLocalDate() } });
    } finally {
      setPending(false);
    }
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
                min={0.01}
                name='protein'
                step={1}
              />
            </Label>
            <Label text='Fat (g)'>
              <NumberInput defaultValue={goal?.fat ?? undefined} min={0.01} name='fat' step={1} />
            </Label>
            <Label text='Carbs (g)'>
              <NumberInput
                defaultValue={goal?.carbs ?? undefined}
                min={0.01}
                name='carbs'
                step={1}
              />
            </Label>
          </div>

          <Btn disabled={pending} type='submit'>
            {pending ? 'Saving…' : 'Save current goals'}
          </Btn>
        </form>
      </section>
    </main>
  );
}

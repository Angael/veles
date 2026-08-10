import { Link, useNavigate } from '@tanstack/react-router';
import type { FormEvent } from 'react';
import { useState } from 'react';
import type { CalorieGoal } from './calories.api';
import { setDailyCalorieGoal } from './calories.api';
import { todayLocalDate } from './calorieDate';
import { Btn } from '@/components/btn/Btn';
import css from './CalorieFlows.module.css';

export function CalorieGoalsPage({ goal }: { goal: CalorieGoal | null }) {
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
          carbs: optional('carbs'),
          date: todayLocalDate(),
          fat: optional('fat'),
          kcal: Number(data.get('kcal')),
          protein: optional('protein'),
        },
      });
      await navigate({ to: '/calories', search: { date: todayLocalDate() } });
    } finally {
      setPending(false);
    }
  }
  return (
    <main className={css.page}>
      <Link className={css.back} search={{ date: todayLocalDate() }} to='/calories'>
        ← Diary
      </Link>
      <header className={css.header}>
        <div>
          <h1>Current goals</h1>
          <p>Changes start today. Earlier goals stay frozen.</p>
        </div>
      </header>
      <section className={css.panel}>
        <form className={css.form} onSubmit={(event) => void submit(event)}>
          <div className={css.grid}>
            <Field defaultValue={goal?.kcal} label='Daily kcal' name='kcal' required />
            <Field defaultValue={goal?.protein} label='Protein (g)' name='protein' />
            <Field defaultValue={goal?.carbs} label='Carbs (g)' name='carbs' />
            <Field defaultValue={goal?.fat} label='Fat (g)' name='fat' />
          </div>
          <Btn disabled={pending} type='submit'>
            {pending ? 'Saving…' : 'Save current goals'}
          </Btn>
        </form>
      </section>
    </main>
  );
}
function Field({
  defaultValue,
  label,
  name,
  required,
}: {
  defaultValue?: number | null;
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <label className={css.field}>
      <span>{label}</span>
      <input
        defaultValue={defaultValue ?? ''}
        min='0.01'
        name={name}
        required={required}
        step='0.01'
        type='number'
      />
    </label>
  );
}

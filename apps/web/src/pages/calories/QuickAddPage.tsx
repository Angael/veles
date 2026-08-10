import { Link, useNavigate } from '@tanstack/react-router';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { recordCustomCalories } from './calories.api';
import { Btn } from '@/components/btn/Btn';
import css from './CalorieFlows.module.css';

export function QuickAddPage({ date }: { date: string }) {
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
      await recordCustomCalories({
        data: {
          carbs: optional('carbs'),
          date,
          fat: optional('fat'),
          kcal: Number(data.get('kcal')),
          name: String(data.get('name') || 'Quick add'),
          protein: optional('protein'),
        },
      });
      await navigate({ to: '/calories', search: { date } });
    } finally {
      setPending(false);
    }
  }
  return (
    <main className={css.page}>
      <Link className={css.back} search={{ date }} to='/calories'>
        ← Diary
      </Link>
      <header className={css.header}>
        <div>
          <h1>Quick add</h1>
          <p>Record energy now. Macros are optional.</p>
        </div>
      </header>
      <section className={css.panel}>
        <form className={css.form} onSubmit={(event) => void submit(event)}>
          <label className={css.field}>
            <span>Label</span>
            <input defaultValue='Quick add' name='name' required />
          </label>
          <div className={css.grid}>
            <Field label='kcal' name='kcal' required />
            <Field label='Protein (g)' name='protein' />
            <Field label='Carbs (g)' name='carbs' />
            <Field label='Fat (g)' name='fat' />
          </div>
          <Btn disabled={pending} type='submit'>
            {pending ? 'Adding…' : 'Add to diary'}
          </Btn>
        </form>
      </section>
    </main>
  );
}
function Field({ label, name, required }: { label: string; name: string; required?: boolean }) {
  return (
    <label className={css.field}>
      <span>{label}</span>
      <input min='0' name={name} required={required} step='0.01' type='number' />
    </label>
  );
}

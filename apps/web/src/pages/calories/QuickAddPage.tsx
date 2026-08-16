import { Link, useNavigate } from '@tanstack/react-router';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { recordCustomCalories } from './calories.api';
import { Btn } from '@/components/btn/Btn';
import { Label } from '@/components/label/Label';
import { NumberInput } from '@/components/number-input/NumberInput';
import { TextInput } from '@/components/text-input/TextInput';
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
          date,
          name: String(data.get('name') || 'Quick add'),
          kcal: Number(data.get('kcal')),
          protein: optional('protein'),
          fat: optional('fat'),
          carbs: optional('carbs'),
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
          <Label text='Label'>
            <TextInput defaultValue='Quick add' name='name' required />
          </Label>

          <div className={css.grid}>
            <Label text='kcal'>
              <NumberInput min={0} name='kcal' required step={0.01} />
            </Label>

            <Label text='Protein (g)'>
              <NumberInput min={0} name='protein' step={0.01} />
            </Label>

            <Label text='Fat (g)'>
              <NumberInput min={0} name='fat' step={0.01} />
            </Label>

            <Label text='Carbs (g)'>
              <NumberInput min={0} name='carbs' step={0.01} />
            </Label>
          </div>

          <Btn disabled={pending} type='submit'>
            {pending ? 'Adding…' : 'Add to diary'}
          </Btn>
        </form>
      </section>
    </main>
  );
}

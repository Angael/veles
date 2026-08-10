import { Link, useNavigate } from '@tanstack/react-router';
import type { FormEvent } from 'react';
import { useState } from 'react';
import type { CalorieLog } from './calories.api';
import { deleteFoodLog, updateFoodLog } from './calories.api';
import { Btn } from '@/components/btn/Btn';
import css from './CalorieFlows.module.css';

export function EditFoodLogPage({ log }: { log: CalorieLog }) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const isProduct = log.kind === 'product';
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const data = new FormData(event.currentTarget);
    const optional = (key: string) => {
      const value = String(data.get(key) ?? '').trim();
      return value ? Number(value) : undefined;
    };
    try {
      await updateFoodLog({
        data: {
          carbs: optional('carbs'),
          date: String(data.get('date')),
          fat: optional('fat'),
          grams: optional('grams'),
          id: log.id,
          kcal: Number(data.get('kcal')),
          name: String(data.get('name')),
          protein: optional('protein'),
        },
      });
      await navigate({ to: '/calories', search: { date: String(data.get('date')) } });
    } finally {
      setPending(false);
    }
  }
  async function remove() {
    setPending(true);
    await deleteFoodLog({ data: { id: log.id } });
    await navigate({ to: '/calories', search: { date: log.date } });
  }
  return (
    <main className={css.page}>
      <Link className={css.back} search={{ date: log.date }} to='/calories'>
        ← Diary
      </Link>
      <header className={css.header}>
        <div>
          <h1>Edit logged entry</h1>
          <p>
            {isProduct
              ? 'Changing quantity recalculates the saved nutrition snapshot.'
              : 'Adjust the custom calories and macros.'}
          </p>
        </div>
      </header>
      <section className={css.panel}>
        <form className={css.form} onSubmit={(event) => void submit(event)}>
          <div className={css.grid}>
            <Field defaultValue={log.name} readOnly={isProduct} label='Name' name='name' required />
            <Field defaultValue={log.date} label='Date' name='date' required type='date' />
            <Field defaultValue={log.grams ?? ''} label='Quantity (g)' name='grams' type='number' />
            <Field
              defaultValue={log.kcal}
              readOnly={isProduct}
              label='kcal'
              name='kcal'
              required
              type='number'
            />
            <Field
              defaultValue={log.protein ?? ''}
              readOnly={isProduct}
              label='Protein (g)'
              name='protein'
              type='number'
            />
            <Field
              defaultValue={log.carbs ?? ''}
              readOnly={isProduct}
              label='Carbs (g)'
              name='carbs'
              type='number'
            />
            <Field
              defaultValue={log.fat ?? ''}
              readOnly={isProduct}
              label='Fat (g)'
              name='fat'
              type='number'
            />
          </div>
          <div className={css.actions}>
            <Btn disabled={pending} type='submit'>
              Save entry
            </Btn>
            <Btn disabled={pending} onClick={() => void remove()} variant='ghost'>
              Delete entry
            </Btn>
            {log.productId ? (
              <Link
                className={css.back}
                params={{ foodId: log.productId }}
                to='/calories/foods/$foodId'
              >
                Edit product itself
              </Link>
            ) : null}
          </div>
        </form>
      </section>
    </main>
  );
}
function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...input } = props;
  return (
    <label className={css.field}>
      <span>{label}</span>
      <input
        min={input.type === 'number' ? '0' : undefined}
        step={input.type === 'number' ? '0.01' : undefined}
        {...input}
      />
    </label>
  );
}

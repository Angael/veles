import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import type { CalorieFood } from './calories.api';
import { updateFoodProduct } from './calories.api';
import { FoodEditor, type FoodEditorValue } from './FoodEditor';
import css from './CalorieFlows.module.css';

export function EditFoodPage({ food }: { food: CalorieFood }) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function save(value: FoodEditorValue) {
    setPending(true);
    setError('');
    try {
      await updateFoodProduct({ data: { ...value, id: food.id } });
      await navigate({
        to: '/calories/add',
        search: { date: new Date().toLocaleDateString('sv-SE'), foodId: food.id },
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save food.');
    } finally {
      setPending(false);
    }
  }
  return (
    <main className={css.page}>
      <Link
        className={css.back}
        search={{ date: new Date().toLocaleDateString('sv-SE'), foodId: food.id }}
        to='/calories/add'
      >
        ← Back
      </Link>
      <header className={css.header}>
        <div>
          <h1>Edit food</h1>
          <p>Changes apply to future diary entries only.</p>
        </div>
      </header>
      <section className={css.panel}>
        {error ? <p className={css.error}>{error}</p> : null}
        <FoodEditor food={food} onSubmit={save} pending={pending} submitLabel='Save food' />
      </section>
    </main>
  );
}

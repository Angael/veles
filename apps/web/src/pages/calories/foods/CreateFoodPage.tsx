import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { createFoodProduct } from '../calories.api';
import { invalidateCalorieFoods } from '../calorieQueries';
import { FoodEditor, type FoodEditorValue } from './FoodEditor';
import css from '../CalorieFlows.module.css';

type Props = { barcode?: string; date: string; name?: string };
export function CreateFoodPage({ barcode, date, name }: Props) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function save(value: FoodEditorValue) {
    setPending(true);
    setError('');
    try {
      await createFoodProduct({ data: value });
      await invalidateCalorieFoods(queryClient);
      await navigate({ to: '/calories', search: { date } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create food.');
    } finally {
      setPending(false);
    }
  }
  return (
    <main className={css.page}>
      <header className={css.header}>
        <div>
          <h1>Create food</h1>
          <p>Add it once, then everyone can find and improve it.</p>
        </div>
      </header>
      <section className={css.panel}>
        {error ? (
          <p className={css.error} role='alert'>
            {error}
          </p>
        ) : null}
        <FoodEditor
          initialBarcode={barcode}
          initialName={name}
          onSubmit={save}
          pending={pending}
          submitLabel='Create food'
        />
      </section>
    </main>
  );
}

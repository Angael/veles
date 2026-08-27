import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useCreateFoodProductMutation } from '../calories.query';
import { FoodEditor, type FoodEditorValue } from './FoodEditor';
import css from '../CalorieFlows.module.css';

type Props = { barcode?: string; date: string; name?: string };
export function CreateFoodPage({ barcode, date, name }: Props) {
  const navigate = useNavigate();
  const createMutation = useCreateFoodProductMutation();
  const [error, setError] = useState('');
  async function save(value: FoodEditorValue) {
    setError('');
    try {
      const product = await createMutation.mutateAsync({ data: value });
      await navigate({ to: '/calories/add', search: { date, foodId: product.id } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create food.');
    }
  }
  return (
    <main className={css.page}>
      <header className={css.header}>
        <div>
          <h1>Create food</h1>
          <p>Add it once for everyone</p>
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
          pending={createMutation.isPending}
          submitLabel='Create food'
        />
      </section>
    </main>
  );
}

import { useNavigate } from '@tanstack/react-router';
import type { CalorieFood } from '../calories.api';
import { useUpdateFoodProductMutation } from '../calories.query';
import { FoodEditor, type FoodEditorValue } from './FoodEditor';
import { todayLocalDate } from '@/lib/dateOnly';
import { CalorieFormError } from '../CalorieFormError';
import css from '../CalorieFlows.module.css';

export function EditFoodPage({ food }: { food: CalorieFood }) {
  const navigate = useNavigate();
  const updateMutation = useUpdateFoodProductMutation();

  async function save(value: FoodEditorValue) {
    await updateMutation.mutateAsync({ ...value, id: food.id });
    await navigate({ to: '/calories', search: { date: todayLocalDate() } });
  }

  return (
    <main className={css.page}>
      <header className={css.header}>
        <div>
          <h1>Edit food</h1>
          <p>Changes apply to future diary entries only.</p>
        </div>
      </header>
      <section className={css.panel}>
        <CalorieFormError error={updateMutation.error} />
        <FoodEditor
          food={food}
          onSubmit={save}
          pending={updateMutation.isPending}
          submitLabel='Save food'
        />
      </section>
    </main>
  );
}

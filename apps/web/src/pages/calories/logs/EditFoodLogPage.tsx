import { Link, useNavigate } from '@tanstack/react-router';
import type { FormEvent } from 'react';
import type { CalorieLog } from '../calories.api';
import { useDeleteFoodLogMutation, useUpdateFoodLogMutation } from '../calories.query';
import { Btn } from '@/components/btn/Btn';
import { DateInput } from '@/components/date-input/DateInput';
import { KcalMacrosForm } from '@/components/kcal-macros-form/KcalMacrosForm';
import { Label } from '@/components/label/Label';
import { NumberInput } from '@/components/number-input/NumberInput';
import { TextInput } from '@/components/text-input/TextInput';
import css from '../CalorieFlows.module.css';

export function EditFoodLogPage({ log }: { log: CalorieLog }) {
  const navigate = useNavigate();
  const deleteMutation = useDeleteFoodLogMutation();
  const updateMutation = useUpdateFoodLogMutation();
  const isProduct = log.productId !== null;
  const isPending = updateMutation.isPending || deleteMutation.isPending;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const optional = (key: string) => {
      const value = String(data.get(key) ?? '').trim();
      return value ? Number(value) : undefined;
    };

    const nextDate = String(data.get('date'));
    await updateMutation.mutateAsync({
      id: log.id,
      date: nextDate,
      previousDate: log.date,
      name: String(data.get('name')),
      grams: optional('grams'),
      kcal: Number(data.get('kcal')),
      protein: optional('protein'),
      fat: optional('fat'),
      carbs: optional('carbs'),
    });
    await navigate({ to: '/calories', search: { date: nextDate } });
  }

  async function remove() {
    await deleteMutation.mutateAsync({ date: log.date, id: log.id });
    await navigate({ to: '/calories', search: { date: log.date } });
  }

  return (
    <main className={css.page}>
      <header className={css.header}>
        <div>
          <h1>Edit logged entry</h1>
          <p>
            {isProduct
              ? 'Product details are saved as a snapshot. Edit the product, then delete and add this entry again to use the new details.'
              : 'Adjust the custom calories and macros.'}
          </p>
        </div>
      </header>
      <section className={css.panel}>
        <form className={css.form} onSubmit={(event) => void submit(event)}>
          <div className={css.grid}>
            <Label text='Name'>
              <TextInput defaultValue={log.name} name='name' readOnly={isProduct} required />
            </Label>

            <Label text='Date'>
              <DateInput defaultValue={log.date} name='date' required />
            </Label>

            <Label text='Quantity (g)'>
              <NumberInput defaultValue={log.grams ?? undefined} min={0} name='grams' step={1} />
            </Label>
          </div>

          <KcalMacrosForm
            defaultValues={{
              kcal: log.kcal,
              protein: log.protein,
              fat: log.fat,
              carbs: log.carbs,
            }}
            readOnly={isProduct}
          />

          <div className={css.actions}>
            <Btn disabled={isPending} onClick={() => void remove()} variant='ghost'>
              Delete entry
            </Btn>
            {log.productId ? (
              <Btn
                isLink
                render={<Link params={{ foodId: log.productId }} to='/calories/foods/$foodId' />}
                variant='ghost'
              >
                Edit product itself
              </Btn>
            ) : null}
            <Btn disabled={isPending} type='submit'>
              Save entry
            </Btn>
          </div>
        </form>
      </section>
    </main>
  );
}

import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import type { FormEvent } from 'react';
import { useState } from 'react';
import type { CalorieLog } from '../calories.api';
import { updateFoodLog } from '../calories.api';
import { useDeleteFoodLogMutation } from '../calorieQueries';
import { invalidateCalorieWeek } from '../calorieQueries';
import { Btn } from '@/components/btn/Btn';
import { DateInput } from '@/components/date-input/DateInput';
import { Label } from '@/components/label/Label';
import { NumberInput } from '@/components/number-input/NumberInput';
import { TextInput } from '@/components/text-input/TextInput';
import css from '../CalorieFlows.module.css';

export function EditFoodLogPage({ log }: { log: CalorieLog }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const deleteMutation = useDeleteFoodLogMutation();
  const [pending, setPending] = useState(false);
  const isProduct = log.productId !== null;
  const isPending = pending || deleteMutation.isPending;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const data = new FormData(event.currentTarget);
    const optional = (key: string) => {
      const value = String(data.get(key) ?? '').trim();
      return value ? Number(value) : undefined;
    };

    const nextDate = String(data.get('date'));
    try {
      await updateFoodLog({
        data: {
          id: log.id,
          date: nextDate,
          name: String(data.get('name')),
          grams: optional('grams'),
          kcal: Number(data.get('kcal')),
          protein: optional('protein'),
          fat: optional('fat'),
          carbs: optional('carbs'),
        },
      });
      await Promise.all([
        invalidateCalorieWeek(queryClient, log.date),
        invalidateCalorieWeek(queryClient, nextDate),
      ]);
      await navigate({ to: '/calories', search: { date: nextDate } });
    } finally {
      setPending(false);
    }
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
              ? 'Changing quantity recalculates the saved nutrition snapshot.'
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

            <Label text='kcal'>
              <NumberInput
                defaultValue={log.kcal}
                min={0}
                name='kcal'
                readOnly={isProduct}
                required
                step={1}
              />
            </Label>

            <Label text='Protein (g)'>
              <NumberInput
                defaultValue={log.protein ?? undefined}
                min={0}
                name='protein'
                readOnly={isProduct}
                step={1}
              />
            </Label>

            <Label text='Fat (g)'>
              <NumberInput
                defaultValue={log.fat ?? undefined}
                min={0}
                name='fat'
                readOnly={isProduct}
                step={1}
              />
            </Label>

            <Label text='Carbs (g)'>
              <NumberInput
                defaultValue={log.carbs ?? undefined}
                min={0}
                name='carbs'
                readOnly={isProduct}
                step={1}
              />
            </Label>
          </div>

          <div className={css.actions}>
            <Btn disabled={isPending} type='submit'>
              Save entry
            </Btn>
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
          </div>
        </form>
      </section>
    </main>
  );
}

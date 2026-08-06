import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import { DateInput } from '@/components/date-input/DateInput';
import { Label } from '@/components/label/Label';
import { NumberInput } from '@/components/number-input/NumberInput';
import { toastManager } from '@/components/toast/toastManager';
import css from './WeightEntryPages.module.css';
import { saveWeight } from './weight.api';

export function AddWeightPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const [date, setDate] = useState(getLocalDate());
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const mutation = useMutation({
    mutationFn: saveWeight,
    onError: () => {
      toastManager.add({
        description: 'Check the date and weight, then try again.',
        priority: 'high',
        title: 'Could not save weight',
        type: 'error',
      });
    },
    onSuccess: async () => {
      await router.invalidate();
      await navigate({ to: '/weight' });
    },
  });

  return (
    <main className={css.page}>
      <Card as='section' className={css.formCard}>
        <div className={css.intro}>
          <h1>Add weight for a date</h1>
          <p>Use this when filling a gap or entering a measurement from another day.</p>
        </div>
        <form
          className={css.form}
          onSubmit={(event) => {
            event.preventDefault();
            if (weightKg !== null) mutation.mutate({ data: { date, weightKg } });
          }}
        >
          <Label text='Date'>
            <DateInput
              max={getLocalDate()}
              onChange={(event) => setDate(event.currentTarget.value)}
              required
              value={date}
            />
          </Label>
          <Label text='Weight (kg)'>
            <NumberInput
              max={300}
              min={30}
              onValueChange={setWeightKg}
              placeholder='e.g. 78.4'
              required
              step={0.1}
              value={weightKg}
            />
          </Label>
          <div className={css.formActions}>
            <Btn isLink render={<Link to='/weight' />} size='sm' variant='ghost'>
              Cancel
            </Btn>
            <Btn
              disabled={!date || weightKg === null}
              loading={mutation.isPending}
              size='sm'
              type='submit'
            >
              Save entry
            </Btn>
          </div>
        </form>
      </Card>
    </main>
  );
}

function getLocalDate() {
  const now = new Date();
  return new Date(now.valueOf() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

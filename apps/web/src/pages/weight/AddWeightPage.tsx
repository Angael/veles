import { useNavigate, useRouter } from '@tanstack/react-router';
import { format } from 'date-fns';
import { useState } from 'react';
import { FormCard, FormFooter, FormPage } from '@/components/ui/form-layout/FormLayout';
import { Label } from '@/components/ui/label/Label';
import { NumberInput } from '@/components/ui/number-input/NumberInput';
import { useSaveWeightMutation } from './weight.query';

export function AddWeightPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const mutation = useSaveWeightMutation();

  return (
    <FormPage lead='Use this when filling a gap or entering a measurement from another day.'>
      <FormCard
        onSubmit={() => {
          if (weightKg === null) {
            return;
          }

          mutation.mutate(
            { data: { date, weightKg } },
            {
              onSuccess: () => {
                void router
                  .invalidate()
                  .then(() => navigate({ replace: true, to: '/weight' }))
                  .catch(() => undefined);
              },
            },
          );
        }}
      >
        <Label text='Weight (kg)'>
          <NumberInput
            enterKeyHint='done'
            max={300}
            min={30}
            onValueChange={setWeightKg}
            placeholder='e.g. 78.4'
            required
            size='lg'
            stepperStep={0.1}
            value={weightKg}
          />
        </Label>
        <FormFooter
          date={{ max: today, onValueChange: setDate, value: date }}
          disabled={!date || weightKg === null}
          loading={mutation.isPending}
          submitLabel='Add weight'
        />
      </FormCard>
    </FormPage>
  );
}

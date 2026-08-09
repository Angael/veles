import { useMutation } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { CheckIcon, GaugeIcon, PlusIcon, ZapIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import { NumberInput } from '@/components/number-input/NumberInput';
import { TextInput } from '@/components/text-input/TextInput';
import { toastManager } from '@/components/toast/toastManager';
import { recordCustomCalories, setDailyCalorieGoal } from './calories.api';
import css from './CaloriesPage.module.css';

type DailyControlsProps = {
  date: string;
  goalKcal: number | null;
};

export function DailyControls({ date, goalKcal }: DailyControlsProps) {
  return (
    <div className={css.controlPair}>
      <GoalForm date={date} goalKcal={goalKcal} />
      <CustomCaloriesForm />
    </div>
  );
}

function GoalForm({ date, goalKcal }: DailyControlsProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(goalKcal === null);
  const [kcal, setKcal] = useState<number | null>(goalKcal);
  useEffect(() => setKcal(goalKcal), [goalKcal]);
  const mutation = useMutation({
    mutationFn: setDailyCalorieGoal,
    onError: () =>
      notifyError('Could not update goal', 'Your previous daily goal is still active.'),
    onSuccess: async () => {
      setEditing(false);
      await router.invalidate();
    },
  });

  return (
    <Card as='section' className={css.compactCard} shadow={false}>
      <div className={css.cardTitle}>
        <GaugeIcon aria-hidden='true' />
        <div>
          <h2>Daily goal</h2>
          <p>Choose the energy target for this date.</p>
        </div>
      </div>
      {editing ? (
        <form
          className={css.inlineForm}
          onSubmit={(event) => {
            event.preventDefault();
            if (kcal !== null) mutation.mutate({ data: { date, kcal } });
          }}
        >
          <label>
            <span>Goal in kcal</span>
            <NumberInput
              min={1}
              onValueChange={setKcal}
              placeholder='2,000'
              required
              step={50}
              value={kcal}
            />
          </label>
          <div className={css.buttonRow}>
            {goalKcal !== null ? (
              <Btn
                onClick={() => {
                  setKcal(goalKcal);
                  setEditing(false);
                }}
                type='button'
                variant='ghost'
              >
                Cancel
              </Btn>
            ) : null}
            <Btn
              disabled={kcal === null || kcal <= 0}
              icon={<CheckIcon aria-hidden='true' />}
              loading={mutation.isPending}
              type='submit'
            >
              Save goal
            </Btn>
          </div>
        </form>
      ) : (
        <div className={css.goalDisplay}>
          <strong>{goalKcal?.toLocaleString()} kcal</strong>
          <Btn onClick={() => setEditing(true)} variant='outlineMain'>
            Edit
          </Btn>
        </div>
      )}
    </Card>
  );
}

function CustomCaloriesForm() {
  const router = useRouter();
  const [name, setName] = useState('Quick calories');
  const [kcal, setKcal] = useState<number | null>(null);
  const mutation = useMutation({
    mutationFn: recordCustomCalories,
    onError: () =>
      notifyError('Could not log calories', 'Nothing was added. Check the values and try again.'),
    onSuccess: async () => {
      setKcal(null);
      await router.invalidate();
      toastManager.add({
        title: 'Calories logged',
        description: 'Today’s totals are up to date.',
        type: 'success',
      });
    },
  });

  return (
    <Card as='section' className={css.compactCard} shadow={false}>
      <div className={css.cardTitle}>
        <ZapIcon aria-hidden='true' />
        <div>
          <h2>Quick add</h2>
          <p>Log a kcal total without creating a food.</p>
        </div>
      </div>
      <form
        className={css.quickForm}
        onSubmit={(event) => {
          event.preventDefault();
          if (kcal !== null) mutation.mutate({ data: { name: name.trim(), kcal } });
        }}
      >
        <label>
          <span>Entry name</span>
          <TextInput onChange={(event) => setName(event.target.value)} required value={name} />
        </label>
        <label>
          <span>Calories</span>
          <NumberInput min={1} onValueChange={setKcal} placeholder='kcal' required value={kcal} />
        </label>
        <Btn
          disabled={!name.trim() || kcal === null || kcal <= 0}
          icon={<PlusIcon aria-hidden='true' />}
          loading={mutation.isPending}
          type='submit'
        >
          Add
        </Btn>
      </form>
    </Card>
  );
}

function notifyError(title: string, description: string) {
  toastManager.add({ title, description, priority: 'high', type: 'error' });
}

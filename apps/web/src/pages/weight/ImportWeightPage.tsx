import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate, useRouter } from '@tanstack/react-router';
import { ClipboardIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import { Label } from '@/components/label/Label';
import { TextareaInput } from '@/components/textarea-input/TextareaInput';
import { toastManager } from '@/components/toast/toastManager';
import css from './WeightEntryPages.module.css';
import { parseWeightEntries } from './parseWeightEntries';
import { saveWeights } from './weight.api';

const aiPrompt = `Convert my weight history to plain text with exactly one entry per line in this format:
YYYY-MM-DD <weight>kg

Use ISO dates, kilograms, and no headings, bullets, notes, or code fences. Convert other weight units to kilograms. Example:
2026-08-01 78.4kg`;

export function ImportWeightPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const parsed = useMemo(() => parseWeightEntries(value), [value]);
  const mutation = useMutation({
    mutationFn: saveWeights,
    onError: () => {
      toastManager.add({
        description: 'Your entries were not imported. Please try again.',
        priority: 'high',
        title: 'Could not import weights',
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
      <Card as='section' className={css.importCard}>
        <div className={css.intro}>
          <h1>Import weight history</h1>
          <p>Paste one measurement per line. Existing entries on the same dates are replaced.</p>
        </div>

        <div className={css.promptBlock}>
          <div>
            <strong>Need help formatting your data?</strong>
            <p>Give the prompt below and your exported data to your preferred AI assistant.</p>
          </div>
          <pre>{aiPrompt}</pre>
          <Btn
            icon={<ClipboardIcon aria-hidden='true' />}
            onClick={() => copyPrompt(aiPrompt)}
            size='sm'
            type='button'
            variant='outlineMain'
          >
            Copy prompt
          </Btn>
        </div>

        <form
          className={css.form}
          onSubmit={(event) => {
            event.preventDefault();
            if (parsed.entries.length > 0 && parsed.errors.length === 0) {
              mutation.mutate({ data: { entries: parsed.entries } });
            }
          }}
        >
          <Label text='Weight data'>
            <TextareaInput
              aria-describedby='weight-import-status'
              className={css.importInput}
              onChange={(event) => setValue(event.currentTarget.value)}
              placeholder={'2026-08-01 78.4kg\n2026-08-02 78.1kg'}
              required
              spellCheck={false}
              value={value}
            />
          </Label>
          <div aria-live='polite' className={css.importStatus} id='weight-import-status'>
            {parsed.errors.length > 0
              ? parsed.errors.join(' ')
              : parsed.entries.length > 0
                ? `${parsed.entries.length} ${parsed.entries.length === 1 ? 'entry' : 'entries'} ready to import.`
                : 'Format: YYYY-MM-DD 78.4kg'}
          </div>
          <div className={css.formActions}>
            <Btn isLink render={<Link to='/weight' />} size='sm' variant='ghost'>
              Cancel
            </Btn>
            <Btn
              disabled={parsed.entries.length === 0 || parsed.errors.length > 0}
              loading={mutation.isPending}
              size='sm'
              type='submit'
            >
              Import {parsed.entries.length || ''}
            </Btn>
          </div>
        </form>
      </Card>
    </main>
  );
}

async function copyPrompt(prompt: string) {
  try {
    await navigator.clipboard.writeText(prompt);
    toastManager.add({ title: 'Prompt copied', type: 'success' });
  } catch {
    toastManager.add({ title: 'Could not copy prompt', type: 'error' });
  }
}

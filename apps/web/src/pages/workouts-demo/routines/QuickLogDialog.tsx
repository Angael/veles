import clsx from 'clsx';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import {
  DialogActions,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { TextareaInput } from '@/components/ui/textarea-input/TextareaInput';
import { toastManager } from '@/components/ui/toast/toastManager';
import { MOCK_HISTORY } from '../mockData';
import css from './Routines.module.css';

const DURATIONS = [20, 30, 45, 60, 90, 120];
const recentNames = [...new Set(MOCK_HISTORY.map((entry) => entry.name))];

type QuickLogDialogProps = { open: boolean; onOpenChange: (open: boolean) => void };

/**
 * The original #177 scope: a session with no sets, just a name, a length and a note
 * ("Football with the office, 90 min"). Stored as a `workout` row with `duration_seconds`.
 */
export function QuickLogDialog({ onOpenChange, open }: QuickLogDialogProps) {
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState(60);

  return (
    <DialogRoot onOpenChange={onOpenChange} open={open}>
      <DialogPopup>
        <DialogTitle>Log activity</DialogTitle>
        <DialogDescription>No sets, just what and how long.</DialogDescription>
        <TextInput
          aria-label='Activity'
          onChange={(event) => setName(event.target.value)}
          placeholder='Football, yoga, long walk…'
          value={name}
        />
        <div className={css.chips}>
          {recentNames.map((recent) => (
            <button className={css.chip} key={recent} onClick={() => setName(recent)} type='button'>
              {recent}
            </button>
          ))}
        </div>
        <div aria-label='Duration' className={css.chips} role='radiogroup'>
          {DURATIONS.map((option) => (
            <button
              aria-checked={option === minutes}
              className={clsx(css.chip, option === minutes && css.chipActive)}
              key={option}
              onClick={() => setMinutes(option)}
              role='radio'
              type='button'
            >
              {option} min
            </button>
          ))}
        </div>
        <TextareaInput aria-label='Note' placeholder='How did it go? (optional)' rows={2} />
        <DialogActions>
          <DialogClose render={<Btn variant='ghost' />}>Cancel</DialogClose>
          <Btn
            disabled={!name.trim()}
            onClick={() => {
              toastManager.add({ title: `Mock: logged ${name}, ${minutes} min` });
              onOpenChange(false);
            }}
          >
            Save
          </Btn>
        </DialogActions>
      </DialogPopup>
    </DialogRoot>
  );
}

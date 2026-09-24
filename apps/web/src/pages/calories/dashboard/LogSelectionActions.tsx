import { CheckIcon, SendIcon, Trash2Icon, XIcon } from 'lucide-react';
import { useState } from 'react';
import type { CalorieLog } from '../calories.api';
import { Btn } from '@/components/ui/btn/Btn';
import css from './LogSelection.module.css';

const previewFriends = ['Maya Chen', 'Alex Rivera'];

type Props = {
  onCancel: () => void;
  onDelete: () => void;
  selectedLogs: Pick<CalorieLog, 'id' | 'name'>[];
};

/** Previews bulk actions without sending, deleting, or persisting diary entries. */
export function LogSelectionActions({ onCancel, onDelete, selectedLogs }: Props) {
  const [action, setAction] = useState<'share' | 'delete' | null>(null);
  const [recipient, setRecipient] = useState(previewFriends[0]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const count = selectedLogs.length;

  function share() {
    setFeedback(
      `Preview only: ${count} ${count === 1 ? 'product' : 'products'} shared with ${recipient}. Nothing was sent.`,
    );
    setAction(null);
  }

  return (
    <div className={css.floatingControls}>
      <div aria-label='Selected product actions' className={css.actionBar} role='group'>
        <Btn
          aria-label='Cancel selection'
          icon={<XIcon aria-hidden='true' />}
          iconOnly
          onClick={onCancel}
          variant='ghost'
        />
        <span aria-live='polite' className={css.count}>
          {count} selected
        </span>
        <Btn
          aria-expanded={action === 'share'}
          className={css.compactAction}
          disabled={count === 0}
          icon={<SendIcon aria-hidden='true' />}
          onClick={() => {
            setFeedback(null);
            setAction(action === 'share' ? null : 'share');
          }}
          size='sm'
          variant='outlineMain'
        >
          Share
        </Btn>
        <Btn
          aria-expanded={action === 'delete'}
          className={css.compactAction}
          disabled={count === 0}
          icon={<Trash2Icon aria-hidden='true' />}
          onClick={() => {
            setFeedback(null);
            setAction(action === 'delete' ? null : 'delete');
          }}
          size='sm'
          variant='outlineDanger'
        >
          Delete
        </Btn>
      </div>
      {action === 'share' ? (
        <div aria-label='Share selection preview' className={css.actionPanel} role='group'>
          <h3>
            Share {count} {count === 1 ? 'product' : 'products'}
          </h3>
          <p>Choose a friend to preview sharing these products. No message will be sent.</p>
          <ul className={css.selectedNames}>
            {selectedLogs.map((entry) => (
              <li key={entry.id}>{entry.name}</li>
            ))}
          </ul>
          <fieldset className={css.recipients}>
            <legend>Send to</legend>
            {previewFriends.map((friend) => (
              <label key={friend}>
                <input
                  checked={recipient === friend}
                  name='preview-recipient'
                  onChange={() => setRecipient(friend)}
                  type='radio'
                  value={friend}
                />
                {friend}
              </label>
            ))}
          </fieldset>
          <div className={css.panelActions}>
            <Btn onClick={() => setAction(null)} size='sm' variant='ghost'>
              Back
            </Btn>
            <Btn icon={<SendIcon aria-hidden='true' />} onClick={share} size='sm'>
              Preview share
            </Btn>
          </div>
        </div>
      ) : null}
      {action === 'delete' ? (
        <div aria-label='Delete selection preview' className={css.actionPanel} role='group'>
          <h3>
            Delete {count} {count === 1 ? 'product' : 'products'}?
          </h3>
          <p>
            This is a preview. Confirming hides the selected rows on this page only. Your diary and
            totals will not change.
          </p>
          <div className={css.panelActions}>
            <Btn onClick={() => setAction(null)} size='sm' variant='ghost'>
              Back
            </Btn>
            <Btn
              icon={<Trash2Icon aria-hidden='true' />}
              onClick={onDelete}
              size='sm'
              variant='danger'
            >
              Hide in preview
            </Btn>
          </div>
        </div>
      ) : null}
      {feedback ? (
        <div aria-live='polite' className={css.actionPanel} role='status'>
          <p>{feedback}</p>
          <Btn
            icon={<CheckIcon aria-hidden='true' />}
            onClick={() => setFeedback(null)}
            size='sm'
            variant='outlineMain'
          >
            Done
          </Btn>
        </div>
      ) : null}
    </div>
  );
}

import { SendIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Checkbox } from '@/components/ui/checkbox/Checkbox';
import { Dialog, DialogTrigger } from '@/components/ui/dialog/Dialog';
import { toastManager } from '@/components/ui/toast/toastManager';
import css from './ShareLogsDialog.module.css';
import { productCount } from './selectionText';

/** Preview-only recipients until friends exist in the data model. */
const previewFriends = ['Maya Chen', 'Alex Rivera', 'Leo Novak'];

type Props = {
  count: number;
  onShared: () => void;
};

/** Picks friends who receive a copy of the selected logs; preview only, nothing is sent. */
export function ShareLogsDialog({ count, onShared }: Props) {
  const [open, setOpen] = useState(false);
  const [recipients, setRecipients] = useState<string[]>([]);
  const products = productCount(count);

  function share() {
    toastManager.add({
      description: 'Preview only: nothing was sent.',
      title: `Shared ${products} with ${recipients.join(', ')}`,
      type: 'success',
    });
    setOpen(false);
    setRecipients([]);
    onShared();
  }

  return (
    <Dialog
      body={
        <div className={css.body}>
          <p>They get a copy of these {products} to add to their own diary.</p>
          <ul className={css.friends}>
            {previewFriends.map((friend) => (
              <li key={friend}>
                <label className={css.friend}>
                  <span aria-hidden='true' className={css.avatar}>
                    {initials(friend)}
                  </span>
                  <span className={css.name}>{friend}</span>
                  <Checkbox
                    checked={recipients.includes(friend)}
                    onCheckedChange={(checked) =>
                      setRecipients((current) =>
                        checked ? [...current, friend] : current.filter((name) => name !== friend),
                      )
                    }
                  />
                </label>
              </li>
            ))}
          </ul>
        </div>
      }
      okButtonProps={{
        disabled: recipients.length === 0,
        icon: <SendIcon aria-hidden='true' />,
        onClick: share,
      }}
      okLabel='Share'
      onOpenChange={setOpen}
      open={open}
      title={`Share ${products}`}
      trigger={
        <Btn icon={<SendIcon aria-hidden='true' />} radius='pill' render={<DialogTrigger />}>
          Share
        </Btn>
      }
    />
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('');
}

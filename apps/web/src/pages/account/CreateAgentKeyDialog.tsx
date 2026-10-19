import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import {
  DialogActions,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog/Dialog';
import { Label } from '@/components/ui/label/Label';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { useCreateApiKeyMutation } from './account.query';
import { AgentSetupGuide } from './AgentSetupGuide';
import css from './AgentAccessCard.module.css';

interface CreateAgentKeyDialogProps {
  userName: string;
}

/** Names a new key, then shows its one-time setup prompt; closing the dialog forgets the key. */
export function CreateAgentKeyDialog({ userName }: CreateAgentKeyDialogProps) {
  const [newKey, setNewKey] = useState<string | null>(null);
  const createMutation = useCreateApiKeyMutation();

  return (
    <DialogRoot
      onOpenChange={(open) => {
        if (open) return;
        setNewKey(null);
        createMutation.reset();
      }}
    >
      <DialogTrigger render={<Btn icon={<PlusIcon aria-hidden='true' />} size='sm' />}>
        New key
      </DialogTrigger>
      <DialogPopup>
        {newKey ? (
          <>
            <div className={css.dialogHead}>
              <DialogTitle>Key created</DialogTitle>
              <DialogDescription>
                It is shown only once. Send this prompt to your AI agent, or to the person who runs
                it.
              </DialogDescription>
            </div>
            <AgentSetupGuide apiKey={newKey} userName={userName} />
            <DialogActions>
              <DialogClose render={<Btn />}>Done</DialogClose>
            </DialogActions>
          </>
        ) : (
          <>
            <div className={css.dialogHead}>
              <DialogTitle>New agent key</DialogTitle>
              <DialogDescription>Name the key after the agent that will use it.</DialogDescription>
            </div>
            <TypedForm
              className={css.dialogForm}
              onSubmit={async (form) => {
                const created = await createMutation.mutateAsync(form.string('name'));
                setNewKey(created.key);
              }}
            >
              <Label text='Key name'>
                <TextInput defaultValue='Vel' maxLength={32} name='name' required />
              </Label>
              {createMutation.error ? (
                <p className={css.error} role='alert'>
                  {createMutation.error.message}
                </p>
              ) : null}
              <DialogActions>
                <DialogClose render={<Btn variant='ghost' />}>Cancel</DialogClose>
                <Btn loading={createMutation.isPending} type='submit'>
                  Create key
                </Btn>
              </DialogActions>
            </TypedForm>
          </>
        )}
      </DialogPopup>
    </DialogRoot>
  );
}

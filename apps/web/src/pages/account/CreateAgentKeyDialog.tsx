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
import { useI18n } from '@/lib/i18n/I18nProvider';
import { selectOnMount } from '@/lib/selectOnMount';
import { useCreateApiKeyMutation } from './account.query';
import { AgentSetupGuide } from './AgentSetupGuide';
import css from './AgentAccessCard.module.css';

interface CreateAgentKeyDialogProps {
  userName: string;
}

/** Names a new key, then shows its one-time setup prompt; closing the dialog forgets the key. */
export function CreateAgentKeyDialog({ userName }: CreateAgentKeyDialogProps) {
  const { t } = useI18n();
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
        {t({ en: 'New key', pl: 'Nowy klucz' })}
      </DialogTrigger>
      <DialogPopup>
        {newKey ? (
          <>
            <div className={css.dialogHead}>
              <DialogTitle>{t({ en: 'Key created', pl: 'Klucz utworzony' })}</DialogTitle>
              <DialogDescription>
                {t({
                  en: 'It is shown only once. Send this prompt to your AI agent, or to the person who runs it.',
                  pl: 'Zobaczysz go tylko raz. Wyślij ten prompt do swojego agenta AI albo do osoby, która go obsługuje.',
                })}
              </DialogDescription>
            </div>
            <AgentSetupGuide apiKey={newKey} userName={userName} />
            <DialogActions>
              <DialogClose render={<Btn />}>{t({ en: 'Done', pl: 'Gotowe' })}</DialogClose>
            </DialogActions>
          </>
        ) : (
          <>
            <div className={css.dialogHead}>
              <DialogTitle>{t({ en: 'New agent key', pl: 'Nowy klucz agenta' })}</DialogTitle>
              <DialogDescription>
                {t({
                  en: 'Name the key after the agent that will use it.',
                  pl: 'Nazwij klucz tak jak agenta, który będzie go używać.',
                })}
              </DialogDescription>
            </div>
            <TypedForm
              className={css.dialogForm}
              onSubmit={async (form) => {
                const created = await createMutation.mutateAsync(form.string('name'));
                setNewKey(created.key);
              }}
            >
              <Label text={t({ en: 'Key name', pl: 'Nazwa klucza' })}>
                <TextInput
                  defaultValue='Vel'
                  maxLength={32}
                  name='name'
                  ref={selectOnMount}
                  required
                />
              </Label>
              {createMutation.error ? (
                <p className={css.error} role='alert'>
                  {createMutation.error.message}
                </p>
              ) : null}
              <DialogActions>
                <DialogClose render={<Btn variant='ghost' />}>
                  {t({ en: 'Cancel', pl: 'Anuluj' })}
                </DialogClose>
                <Btn loading={createMutation.isPending} type='submit'>
                  {t({ en: 'Create key', pl: 'Utwórz klucz' })}
                </Btn>
              </DialogActions>
            </TypedForm>
          </>
        )}
      </DialogPopup>
    </DialogRoot>
  );
}

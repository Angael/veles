import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import {
  DialogActions,
  DialogClose,
  DialogPopup,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog/Dialog';
import { FloatingButton } from '@/components/ui/floating-button/FloatingButton';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { useCreateNoteMutation } from './notes.query';
import css from './TodosPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

/** Floating "Add note" button that asks for a title in a dialog; the form resets on each open. */
export function NoteComposer() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const createNote = useCreateNoteMutation();

  return (
    <DialogRoot onOpenChange={setOpen} open={open}>
      <FloatingButton icon={<PlusIcon aria-hidden='true' />} render={<DialogTrigger />}>
        {t({ en: 'Add note', pl: 'Dodaj notatkę' })}
      </FloatingButton>
      <DialogPopup>
        <DialogTitle>{t({ en: 'New note', pl: 'Nowa notatka' })}</DialogTitle>
        <TypedForm
          className={css.composerForm}
          onSubmit={async (data) => {
            await createNote.mutateAsync({
              content: '',
              title: data.string('title'),
              type: 'note',
            });
            setOpen(false);
          }}
        >
          <SeamlessTextInput
            aria-label={t({ en: 'Title', pl: 'Tytuł' })}
            className={css.titleInput}
            maxLength={160}
            name='title'
            placeholder={t({ en: 'Note title', pl: 'Tytuł notatki' })}
            required
          />
          <DialogActions>
            <DialogClose render={<Btn variant='ghost' />}>
              {t({ en: 'Cancel', pl: 'Anuluj' })}
            </DialogClose>
            <Btn loading={createNote.isPending} type='submit'>
              {t({ en: 'Create note', pl: 'Utwórz notatkę' })}
            </Btn>
          </DialogActions>
        </TypedForm>
      </DialogPopup>
    </DialogRoot>
  );
}

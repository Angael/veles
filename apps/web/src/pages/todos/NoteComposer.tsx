import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogTrigger } from '@/components/ui/dialog/Dialog';
import { FloatingButton } from '@/components/ui/floating-button/FloatingButton';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { useCreateNoteMutation } from './notes.query';
import css from './TodosPage.module.css';

const NEW_NOTE_FORM_ID = 'new-note-form';

export function NoteComposer() {
  const [formKey, setFormKey] = useState(0);
  const [open, setOpen] = useState(false);
  const createNote = useCreateNoteMutation();

  return (
    <Dialog
      body={
        <div className={css.composer}>
          <TypedForm
            key={formKey}
            className={css.composerForm}
            id={NEW_NOTE_FORM_ID}
            onSubmit={async (data) => {
              await createNote.mutateAsync({
                content: '',
                title: data.string('title'),
                type: 'note',
              });
              setFormKey((key) => key + 1);
              setOpen(false);
            }}
          >
            <SeamlessTextInput
              aria-label='Title'
              className={css.titleInput}
              maxLength={160}
              name='title'
              placeholder='Note title'
              required
            />
          </TypedForm>
        </div>
      }
      okButtonProps={{
        form: NEW_NOTE_FORM_ID,
        loading: createNote.isPending,
        type: 'submit',
      }}
      okLabel='Create note'
      onOpenChange={setOpen}
      open={open}
      title='New note'
      trigger={
        <FloatingButton icon={<PlusIcon aria-hidden='true' />} render={<DialogTrigger />}>
          Add note
        </FloatingButton>
      }
    />
  );
}

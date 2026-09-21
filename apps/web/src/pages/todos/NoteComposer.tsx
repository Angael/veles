import { FileTextIcon, ListChecksIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Dialog, DialogTrigger } from '@/components/ui/dialog/Dialog';
import { FloatingButton } from '@/components/ui/floating-button/FloatingButton';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { SeamlessTextarea } from '@/components/ui/seamless-textarea/SeamlessTextarea';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { useCreateNoteMutation } from './notes.query';
import css from './TodosPage.module.css';

type ComposerType = 'note' | 'shopping_list';

const NEW_NOTE_FORM_ID = 'new-note-form';

export function NoteComposer() {
  const [formKey, setFormKey] = useState(0);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ComposerType>('note');
  const createNote = useCreateNoteMutation();

  return (
    <Dialog
      body={
        <div className={css.composer}>
          <div aria-label='Note type' className={css.typePicker} role='group'>
            <Btn
              aria-pressed={type === 'note'}
              icon={<FileTextIcon aria-hidden='true' />}
              onClick={() => setType('note')}
              type='button'
              variant={type === 'note' ? 'main' : 'ghost'}
            >
              Text note
            </Btn>
            <Btn
              aria-pressed={type === 'shopping_list'}
              icon={<ListChecksIcon aria-hidden='true' />}
              onClick={() => setType('shopping_list')}
              type='button'
              variant={type === 'shopping_list' ? 'main' : 'ghost'}
            >
              Checklist
            </Btn>
          </div>

          <TypedForm
            key={formKey}
            className={css.composerForm}
            id={NEW_NOTE_FORM_ID}
            onSubmit={async (data) => {
              await createNote.mutateAsync({
                content: type === 'note' ? data.string('content') : '',
                title: data.string('title'),
                type,
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
              placeholder={type === 'note' ? 'Note title' : 'Checklist title'}
              required
            />
            {type === 'note' ? (
              <SeamlessTextarea
                aria-label='Note content'
                className={css.contentInput}
                maxLength={16000}
                name='content'
                placeholder='Write your note…'
                rows={5}
              />
            ) : (
              <input name='content' type='hidden' value='' />
            )}
          </TypedForm>
        </div>
      }
      okButtonProps={{
        form: NEW_NOTE_FORM_ID,
        loading: createNote.isPending,
        type: 'submit',
      }}
      okLabel={`Create ${type === 'note' ? 'note' : 'checklist'}`}
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

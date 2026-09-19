import { FileTextIcon, ListPlusIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { SeamlessTextarea } from '@/components/ui/seamless-textarea/SeamlessTextarea';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { useCreateNoteMutation } from './notes.query';
import css from './TodosPage.module.css';

type ComposerType = 'note' | 'shopping_list';

export function NoteComposer() {
  const [formKey, setFormKey] = useState(0);
  const [type, setType] = useState<ComposerType>('note');
  const createNote = useCreateNoteMutation();

  return (
    <section aria-labelledby='new-note-heading' className={css.composer}>
      <div className={css.composerHeader}>
        <h2 id='new-note-heading'>Add something</h2>
        <div aria-label='Note type' className={css.typePicker} role='group'>
          <Btn
            aria-pressed={type === 'note'}
            icon={<FileTextIcon aria-hidden='true' />}
            onClick={() => setType('note')}
            size='sm'
            type='button'
            variant={type === 'note' ? 'main' : 'ghost'}
          >
            Note
          </Btn>
          <Btn
            aria-pressed={type === 'shopping_list'}
            icon={<ListPlusIcon aria-hidden='true' />}
            onClick={() => setType('shopping_list')}
            size='sm'
            type='button'
            variant={type === 'shopping_list' ? 'main' : 'ghost'}
          >
            Shopping list
          </Btn>
        </div>
      </div>

      <TypedForm
        key={formKey}
        className={css.composerForm}
        onSubmit={async (data) => {
          await createNote.mutateAsync({
            content: type === 'note' ? data.string('content') : '',
            title: data.string('title'),
            type,
          });
          setFormKey((key) => key + 1);
        }}
      >
        <SeamlessTextInput
          aria-label='Title'
          className={css.titleInput}
          maxLength={160}
          name='title'
          placeholder={type === 'note' ? 'Note title' : 'Shopping list title'}
          required
        />
        {type === 'note' ? (
          <SeamlessTextarea
            aria-label='Note content'
            className={css.contentInput}
            maxLength={16000}
            name='content'
            placeholder='Write your note…'
            rows={3}
          />
        ) : (
          <input name='content' type='hidden' value='' />
        )}
        <Btn loading={createNote.isPending} type='submit'>
          Add {type === 'note' ? 'note' : 'shopping list'}
        </Btn>
      </TypedForm>
    </section>
  );
}

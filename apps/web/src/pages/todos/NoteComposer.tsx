import { FileTextIcon, ListChecksIcon, PlusIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import {
  DialogActions,
  DialogClose,
  DialogPopup,
  DialogRoot,
  DialogTrigger,
} from '@/components/ui/dialog/Dialog';
import { FloatingButton } from '@/components/ui/floating-button/FloatingButton';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { SeamlessTextarea } from '@/components/ui/seamless-textarea/SeamlessTextarea';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { DraftChecklist, linesToDraftItems, newDraftItem, type DraftItem } from './DraftChecklist';
import type { NoteSummary } from './notes.api';
import { useCreateNoteMutation } from './notes.query';
import css from './TodosPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type CreateNoteMutation = ReturnType<typeof useCreateNoteMutation>;

/**
 * Floating "Add note" button that opens a draft note dialog. The draft resets on each open, stays
 * while a save is pending or fails, and only closes on success, so nothing is lost or created twice.
 */
export function NoteComposer() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const createNote = useCreateNoteMutation();

  return (
    <DialogRoot
      disablePointerDismissal
      onOpenChange={(nextOpen) => {
        if (!nextOpen && createNote.isPending) return;
        setOpen(nextOpen);
      }}
      open={open}
    >
      <FloatingButton icon={<PlusIcon aria-hidden='true' />} render={<DialogTrigger />}>
        {t({ en: 'Add note', pl: 'Dodaj notatkę' })}
      </FloatingButton>
      <DialogPopup aria-label={t({ en: 'New note', pl: 'Nowa notatka' })}>
        <NoteComposerForm createNote={createNote} onCreated={() => setOpen(false)} />
      </DialogPopup>
    </DialogRoot>
  );
}

/** Editable title plus text or checklist body; switching type converts lines like saved notes do. */
function NoteComposerForm({
  createNote,
  onCreated,
}: {
  createNote: CreateNoteMutation;
  onCreated: () => void;
}) {
  const { t } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<NoteSummary['type']>('note');
  const [content, setContent] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const isChecklist = type === 'shopping_list';

  const toggleType = () => {
    if (isChecklist) {
      setContent(
        items
          .map((item) => item.name.trim())
          .filter(Boolean)
          .join('\n'),
      );
      setType('note');
    } else {
      const converted = linesToDraftItems(content);
      setItems(converted.length ? converted : [newDraftItem()]);
      setType('shopping_list');
    }
  };

  return (
    <TypedForm
      className={css.composerForm}
      onSubmit={(data) => {
        if (createNote.isPending) return;
        const title = data.string('title');
        const variables = isChecklist
          ? {
              content: '',
              items: items.map((item) => item.name.trim()).filter(Boolean),
              title,
              type,
            }
          : { content, title, type };
        createNote.mutate(variables, { onSuccess: onCreated });
      }}
      ref={formRef}
    >
      <div className={css.cardHeader}>
        <SeamlessTextInput
          aria-label={t({ en: 'Note title', pl: 'Tytuł notatki' })}
          autoFocus
          className={css.titleInput}
          enterKeyHint='next'
          maxLength={160}
          name='title'
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              event.preventDefault();
              formRef.current?.querySelector<HTMLElement>('[data-draft-body]')?.focus();
            }
          }}
          placeholder={t({ en: 'Note title', pl: 'Tytuł notatki' })}
          required
        />
        <Btn
          aria-label={
            isChecklist
              ? t({ en: 'Convert to text note', pl: 'Zamień na notatkę tekstową' })
              : t({ en: 'Convert to checklist', pl: 'Zamień na listę kontrolną' })
          }
          disabled={createNote.isPending}
          icon={
            isChecklist ? (
              <FileTextIcon aria-hidden='true' />
            ) : (
              <ListChecksIcon aria-hidden='true' />
            )
          }
          iconOnly
          onClick={toggleType}
          size='sm'
          type='button'
          variant='ghost'
        />
      </div>
      {isChecklist ? (
        <DraftChecklist items={items} onItemsChange={setItems} />
      ) : (
        <SeamlessTextarea
          aria-label={t({ en: 'Note content', pl: 'Treść notatki' })}
          className={css.contentInput}
          data-draft-body
          maxLength={16000}
          onChange={(event) => setContent(event.currentTarget.value)}
          placeholder={t({ en: 'Write your note…', pl: 'Napisz notatkę…' })}
          rows={4}
          value={content}
        />
      )}
      <DialogActions>
        <DialogClose disabled={createNote.isPending} render={<Btn variant='ghost' />}>
          {t({ en: 'Cancel', pl: 'Anuluj' })}
        </DialogClose>
        <Btn loading={createNote.isPending} type='submit'>
          {t({ en: 'Create note', pl: 'Utwórz notatkę' })}
        </Btn>
      </DialogActions>
    </TypedForm>
  );
}

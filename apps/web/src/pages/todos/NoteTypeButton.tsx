import { FileTextIcon, ListChecksIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import type { NoteSummary } from './notes.api';
import { useToggleNoteTypeMutation } from './notes.query';

export function NoteTypeButton({ note }: { note: NoteSummary }) {
  const toggleType = useToggleNoteTypeMutation();
  const isChecklist = note.type === 'shopping_list';

  return (
    <Btn
      aria-label={isChecklist ? 'Convert to text note' : 'Convert to checklist'}
      icon={
        isChecklist ? <FileTextIcon aria-hidden='true' /> : <ListChecksIcon aria-hidden='true' />
      }
      iconOnly
      loading={toggleType.isPending}
      onClick={() => toggleType.mutate({ id: note.id })}
      size='sm'
      type='button'
      variant='ghost'
    />
  );
}

import { FileTextIcon, ListChecksIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import type { NoteSummary } from './notes.api';
import { useToggleNoteTypeMutation } from './notes.query';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function NoteTypeButton({ note }: { note: NoteSummary }) {
  const { t } = useI18n();
  const toggleType = useToggleNoteTypeMutation();
  const isChecklist = note.type === 'shopping_list';

  return (
    <Btn
      aria-label={
        isChecklist
          ? t({ en: 'Convert to text note', pl: 'Zamień na notatkę tekstową' })
          : t({ en: 'Convert to checklist', pl: 'Zamień na listę kontrolną' })
      }
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

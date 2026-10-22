import { FileTextIcon, ListChecksIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import type { NoteSummary } from './notes.api';
import type { useNoteSave } from './useNoteSave';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function NoteTypeButton({
  note,
  noteSave,
}: {
  note: NoteSummary;
  noteSave: ReturnType<typeof useNoteSave>;
}) {
  const { t } = useI18n();
  const isChecklist = note.type === 'shopping_list';

  return (
    <Btn
      aria-label={
        isChecklist
          ? t({ en: 'Convert to text note', pl: 'Zamień na notatkę tekstową' })
          : t({ en: 'Convert to checklist', pl: 'Zamień na listę kontrolną' })
      }
      disabled={noteSave.stale}
      icon={
        isChecklist ? <FileTextIcon aria-hidden='true' /> : <ListChecksIcon aria-hidden='true' />
      }
      iconOnly
      loading={noteSave.togglingType}
      onClick={noteSave.toggleType}
      size='sm'
      type='button'
      variant='ghost'
    />
  );
}

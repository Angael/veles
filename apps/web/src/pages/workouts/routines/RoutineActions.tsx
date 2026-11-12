import { useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ArchiveIcon, ArchiveRestoreIcon, EllipsisIcon, Trash2Icon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { MenuBtn, MenuBtnItem, MenuBtnPopup, MenuBtnRoot } from '@/components/ui/menu-btn/MenuBtn';
import {
  routineQueryOptions,
  useArchiveRoutineMutation,
  useDeleteRoutineMutation,
} from './routines.query';
import { useI18n } from '@/lib/i18n/I18nProvider';

/** Rare routine actions in the task header, which renders outside the page. */
export function RoutineActions() {
  const { t } = useI18n();
  const { id } = useParams({ from: '/_authenticated/workouts/routines/$id' });
  const { data: routine } = useSuspenseQuery(routineQueryOptions(id));
  const navigate = useNavigate();
  const archiveRoutine = useArchiveRoutineMutation();
  const deleteRoutine = useDeleteRoutineMutation();

  return (
    <MenuBtnRoot>
      <Btn
        aria-label={t({ en: 'More routine actions', pl: 'Więcej akcji planu' })}
        icon={<EllipsisIcon aria-hidden='true' />}
        iconOnly
        render={<MenuBtn />}
        radius='pill'
        size='sm'
        variant='ghost'
      />
      <MenuBtnPopup
        aria-label={t({ en: 'Routine actions', pl: 'Akcje planu' })}
        heading={t({ en: 'Routine', pl: 'Plan' })}
      >
        {routine.archived ? (
          <MenuBtnItem
            icon={<ArchiveRestoreIcon aria-hidden='true' />}
            label={t({ en: 'Restore routine', pl: 'Przywróć plan' })}
            onClick={() => archiveRoutine.mutate({ archived: false, id: routine.id })}
          />
        ) : (
          <MenuBtnItem
            icon={<ArchiveIcon aria-hidden='true' />}
            label={t({ en: 'Archive routine', pl: 'Archiwizuj plan' })}
            onClick={() => archiveRoutine.mutate({ archived: true, id: routine.id })}
          />
        )}
        <MenuBtnItem
          icon={<Trash2Icon aria-hidden='true' />}
          label={t({ en: 'Delete routine', pl: 'Usuń plan' })}
          onClick={() => {
            const message = t({
              en: `Delete routine “${routine.name}”? Past workouts stay.`,
              pl: `Usunąć plan „${routine.name}”? Wcześniejsze treningi zostaną.`,
            });
            if (!window.confirm(message)) return;
            // Leave first, so the deleted routine is not refetched on this page.
            void navigate({ replace: true, to: '/workouts' });
            deleteRoutine.mutate({ id: routine.id });
          }}
        />
      </MenuBtnPopup>
    </MenuBtnRoot>
  );
}

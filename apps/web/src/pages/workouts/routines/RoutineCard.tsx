import { Link } from '@tanstack/react-router';
import { ArchiveIcon, ArchiveRestoreIcon, ChevronRightIcon, Trash2Icon } from 'lucide-react';
import {
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuRoot,
  ContextMenuTrigger,
} from '@/components/ui/context-menu/ContextMenu';
import type { RoutineSummary } from './routines.api';
import { useArchiveRoutineMutation, useDeleteRoutineMutation } from './routines.query';
import css from './Routines.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { SHORT_DAY } from '../metrics';

/** How many exercise names a card shows before summing up the rest. */
const SHOWN_EXERCISES = 6;

/**
 * A routine card that opens its page. Long press or right click archives, restores, or deletes it.
 */
export function RoutineCard({ routine }: { routine: RoutineSummary }) {
  const { t } = useI18n();
  const archiveRoutine = useArchiveRoutineMutation();
  const deleteRoutine = useDeleteRoutineMutation();

  return (
    <ContextMenuRoot>
      <ContextMenuTrigger
        render={
          <Link className={css.card} params={{ id: routine.id }} to='/workouts/routines/$id' />
        }
      >
        <RoutineCardContent routine={routine} />
      </ContextMenuTrigger>
      <ContextMenuPopup
        aria-label={t({ en: `${routine.name} actions`, pl: `Akcje: ${routine.name}` })}
      >
        {routine.archived ? (
          <ContextMenuItem
            icon={<ArchiveRestoreIcon aria-hidden='true' />}
            label={t({ en: 'Restore routine', pl: 'Przywróć plan' })}
            onClick={() => archiveRoutine.mutate({ archived: false, id: routine.id })}
          />
        ) : (
          <ContextMenuItem
            icon={<ArchiveIcon aria-hidden='true' />}
            label={t({ en: 'Archive routine', pl: 'Archiwizuj plan' })}
            onClick={() => archiveRoutine.mutate({ archived: true, id: routine.id })}
          />
        )}
        <ContextMenuItem
          icon={<Trash2Icon aria-hidden='true' />}
          label={t({ en: 'Delete routine', pl: 'Usuń plan' })}
          onClick={() => {
            if (
              window.confirm(
                t({
                  en: `Delete routine “${routine.name}”? Past workouts stay.`,
                  pl: `Usunąć plan „${routine.name}”? Wcześniejsze treningi zostaną.`,
                }),
              )
            ) {
              deleteRoutine.mutate({ id: routine.id });
            }
          }}
          variant='danger'
        />
      </ContextMenuPopup>
    </ContextMenuRoot>
  );
}

function RoutineCardContent({ routine }: { routine: RoutineSummary }) {
  const { formatDate, t } = useI18n();
  const hidden = routine.exerciseNames.length - SHOWN_EXERCISES;

  return (
    <>
      <span className={css.name}>{routine.name}</span>
      {routine.description ? (
        <span className={css.description}>{routine.description}</span>
      ) : (
        <span />
      )}
      {routine.exerciseNames.length > 0 ? (
        <ul className={css.exercises}>
          {routine.exerciseNames.slice(0, SHOWN_EXERCISES).map((name, index) => (
            <li key={`${name}-${index}`}>{name}</li>
          ))}
          {hidden > 0 ? <li>+{hidden}</li> : null}
        </ul>
      ) : (
        <span className={css.description}>{t({ en: 'No exercises', pl: 'Brak ćwiczeń' })}</span>
      )}
      <span className={css.footer}>
        <span>
          {routine.lastUsed
            ? t({
                en: `Last done ${formatDate(routine.lastUsed, SHORT_DAY)}`,
                pl: `Ostatnio ${formatDate(routine.lastUsed, SHORT_DAY)}`,
              })
            : t({ en: 'Not done yet', pl: 'Jeszcze nie wykonany' })}
        </span>
        <ChevronRightIcon aria-hidden='true' />
      </span>
    </>
  );
}

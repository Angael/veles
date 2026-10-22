import { Card } from '@/components/ui/card/Card';
import { UnsavedCopy } from '@/components/ui/conflict-notice/UnsavedCopy';
import type { useNoteSave } from './useNoteSave';
import css from './TodosPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

/** Tells the user the note changed elsewhere: first while the latest version loads, then their text. */
export function NoteConflict({ noteSave }: { noteSave: ReturnType<typeof useNoteSave> }) {
  const { t } = useI18n();

  return (
    <>
      {noteSave.stale ? (
        <Card className={css.conflict} role='status' tone='danger'>
          {t({
            en: 'Someone else changed this note. Loading the latest version…',
            pl: 'Ktoś inny zmienił tę notatkę. Wczytywanie najnowszej wersji…',
          })}
        </Card>
      ) : null}
      {noteSave.unsavedText === null ? null : (
        <UnsavedCopy
          className={css.conflict}
          description={t({
            en: 'Someone else changed this note while you edited it, so your changes were not saved. The note now shows the latest version. Copy what you need from your text below.',
            pl: 'Ktoś inny zmienił tę notatkę podczas Twojej edycji, więc Twoje zmiany nie zostały zapisane. Notatka pokazuje teraz najnowszą wersję. Skopiuj potrzebne fragmenty ze swojego tekstu poniżej.',
          })}
          onDismiss={noteSave.dismissUnsavedText}
          text={noteSave.unsavedText}
        />
      )}
    </>
  );
}

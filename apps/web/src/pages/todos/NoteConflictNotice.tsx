import { ConflictNotice } from '@/components/ui/conflict-notice/ConflictNotice';
import css from './TodosPage.module.css';
import type { useNoteDraft } from './useNoteDraft';

/** Shows a card's rejected stale save and the ways to reconcile it. */
export function NoteConflictNotice({ noteDraft }: { noteDraft: ReturnType<typeof useNoteDraft> }) {
  const { conflicted, recovered } = noteDraft;
  if (!conflicted && !recovered) return null;

  return (
    <ConflictNotice
      className={css.conflict}
      loading={noteDraft.loadingLatest}
      onDiscardMine={noteDraft.discardRecovered}
      onLoadLatest={noteDraft.loadLatest}
      onUseMine={noteDraft.restoreRecovered}
      recoveredText={
        conflicted || !recovered
          ? null
          : [recovered.title, recovered.content].filter(Boolean).join('\n\n')
      }
    />
  );
}

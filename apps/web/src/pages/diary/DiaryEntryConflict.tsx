import { useRouter } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ConflictNotice } from '@/components/ui/conflict-notice/ConflictNotice';
import { useUnsavedChangesGuard } from '@/lib/useUnsavedChangesGuard';
import type { DiaryEntryDraft } from './useDiaryEntrySave';
import css from './DiaryEntryPage.module.css';

type DiaryEntryConflictProps = {
  conflicted: boolean;
  draft: DiaryEntryDraft;
  /** A save is still running; loading the latest entry waits for it. */
  saving: boolean;
  onUseMine: (draft: DiaryEntryDraft) => void;
};

/**
 * Lets the user recover from a rejected stale save: keeps the draft, reloads the newer entry into
 * the editor, and then offers the kept draft back. Leaving the page asks first while text is kept.
 */
export function DiaryEntryConflict({
  conflicted,
  draft,
  onUseMine,
  saving,
}: DiaryEntryConflictProps) {
  const router = useRouter();
  const [recovered, setRecovered] = useState<DiaryEntryDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const { markDirty, markSaved } = useUnsavedChangesGuard();
  const holdsUnsavedText = conflicted || recovered !== null;

  useEffect(() => {
    if (holdsUnsavedText) markDirty();
    else markSaved();
  }, [holdsUnsavedText, markDirty, markSaved]);

  if (!holdsUnsavedText) return null;

  return (
    <ConflictNotice
      className={css.conflict}
      loading={loading || saving}
      onDiscardMine={() => setRecovered(null)}
      onLoadLatest={() => {
        setRecovered(draft);
        setLoading(true);
        void router
          .invalidate()
          .catch(() => undefined)
          .finally(() => setLoading(false));
      }}
      onUseMine={() => {
        if (recovered) onUseMine(recovered);
        setRecovered(null);
      }}
      recoveredText={
        conflicted || !recovered
          ? null
          : [recovered.title, recovered.markdown].filter(Boolean).join('\n\n')
      }
    />
  );
}

import { type ChangeEvent, useRef, useState } from 'react';
import type { SaveTextResult } from './notes.api';

type SyncedDraftOptions = {
  /** Returns the value to save, or `null` to discard the edit and restore the server value. */
  normalize?: (value: string) => string | null;
  save: (value: string, base: string, onSuccess: (result: SaveTextResult) => void) => void;
  serverValue: string;
};

/**
 * Local draft for a text field that other users may edit at the same time.
 * Follows fresh server values until the user types, saves on blur only after a real local edit,
 * and sends the server value the edit started from (`base`) so the server can report a conflict
 * instead of silently overwriting someone else's change.
 */
export function useSyncedDraft({
  normalize = (value) => value,
  save,
  serverValue,
}: SyncedDraftOptions) {
  const [draft, setDraft] = useState(serverValue);
  const [base, setBase] = useState(serverValue);
  const [dirty, setDirty] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  // Counts local edits so a finished save can tell whether the user kept typing meanwhile.
  const editCount = useRef(0);

  if (!dirty && base !== serverValue) {
    setBase(serverValue);
    setDraft(serverValue);
  }

  function commit(saveBase: string) {
    const value = normalize(draft);
    if (value === null) {
      setDraft(serverValue);
      setBase(serverValue);
      setDirty(false);
      setConflict(null);
      return;
    }
    if (value === saveBase) {
      setDraft(value);
      setBase(saveBase);
      setDirty(false);
      setConflict(null);
      return;
    }

    const savedAtEdit = editCount.current;
    save(value, saveBase, (result) => {
      if (result.status === 'conflict') {
        setConflict(result.current);
        return;
      }
      setConflict(null);
      setBase(result.value);
      if (editCount.current === savedAtEdit) {
        setDraft(result.value);
        setDirty(false);
      }
    });
  }

  return {
    acceptTheirs: () => {
      if (conflict === null) return;
      setDraft(conflict);
      setBase(conflict);
      setDirty(false);
      setConflict(null);
    },
    conflict,
    inputProps: {
      onBlur: () => {
        if (dirty) commit(base);
      },
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        editCount.current += 1;
        setDraft(event.currentTarget.value);
        setDirty(true);
      },
      value: draft,
    },
    keepMine: () => {
      if (conflict !== null) commit(conflict);
    },
  };
}

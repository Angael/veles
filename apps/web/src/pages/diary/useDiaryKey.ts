import { useEffect, useState } from 'react';
import { getUnlockedDiaryKey, loadDiaryKey } from '@/lib/diaryKeyVault';
import type { DiaryKeyRecord } from './diaryCrypto';

export type DiaryKeyState =
  | { status: 'checking' | 'locked' | 'setup' }
  | { key: CryptoKey; status: 'unlocked' };

/** Resolves whether the diary needs setup, is locked, or has a key unlocked on this device. */
export function useDiaryKey(keyRecord: DiaryKeyRecord | null) {
  const wrappedKey = keyRecord?.wrappedKey ?? null;
  const [state, setState] = useState<DiaryKeyState>(() => getInitialState(wrappedKey));

  useEffect(() => {
    if (!wrappedKey) {
      setState({ status: 'setup' });
      return;
    }

    let active = true;
    void loadDiaryKey(wrappedKey).then((key) => {
      if (active) setState(key ? { key, status: 'unlocked' } : { status: 'locked' });
    });
    return () => {
      active = false;
    };
  }, [wrappedKey]);

  return [state, setState] as const;
}

function getInitialState(wrappedKey: string | null): DiaryKeyState {
  if (!wrappedKey) return { status: 'setup' };
  const key = getUnlockedDiaryKey(wrappedKey);
  return key ? { key, status: 'unlocked' } : { status: 'checking' };
}

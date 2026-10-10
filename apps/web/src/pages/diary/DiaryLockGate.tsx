import type { ReactNode } from 'react';
import { clearDiaryKey } from '@/lib/diaryKeyVault';
import type { DiaryKeyRecord } from './diaryCrypto';
import { DiaryPassphraseForm } from './DiaryPassphraseForm';
import { useDiaryKey } from './useDiaryKey';

type DiaryLockGateProps = {
  children: (key: CryptoKey, lock: () => void) => ReactNode;
  keyRecord: DiaryKeyRecord | null;
};

/** Renders diary content only after the browser holds the diary key. */
export function DiaryLockGate({ children, keyRecord }: DiaryLockGateProps) {
  const [state, setState] = useDiaryKey(keyRecord);

  if (state.status === 'checking') return null;

  if (state.status === 'unlocked') {
    return children(state.key, () => {
      setState({ status: 'locked' });
      void clearDiaryKey();
    });
  }

  return (
    <DiaryPassphraseForm
      keyRecord={keyRecord}
      onUnlocked={(key) => setState({ key, status: 'unlocked' })}
    />
  );
}

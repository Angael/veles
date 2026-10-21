import { useState } from 'react';
import { ConflictNotice } from '@/components/ui/conflict-notice/ConflictNotice';

export function ConflictNoticeDemo() {
  const [recoveredText, setRecoveredText] = useState<string | null>(null);

  return (
    <section>
      <h2>ConflictNotice</h2>
      <ConflictNotice
        onDiscardMine={() => setRecoveredText(null)}
        onLoadLatest={() => setRecoveredText('Shopping\n\nMilk, eggs, and bread')}
        onUseMine={() => setRecoveredText(null)}
        recoveredText={recoveredText}
      />
    </section>
  );
}

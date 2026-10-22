import { ConflictNotice } from '@/components/ui/conflict-notice/ConflictNotice';
import { UnsavedCopy } from '@/components/ui/conflict-notice/UnsavedCopy';

export function ConflictNoticeDemo() {
  return (
    <section>
      <h2>ConflictNotice</h2>
      <ConflictNotice onKeepMine={() => undefined} onLoadLatest={() => undefined} />
      <UnsavedCopy onDismiss={() => undefined} text={'Shopping\n\nMilk, eggs, bread'} />
    </section>
  );
}

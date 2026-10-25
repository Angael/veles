import { useState } from 'react';
import { ScrubCell } from '@/components/ui/scrub/ScrubCell';
import { ScrubField } from '@/components/ui/scrub/ScrubField';

const TIERS = [
  { from: 0, step: 1 },
  { from: 0.3, step: 5 },
  { from: 0.65, step: 10 },
];

const parse = (text: string) => {
  const value = Number(text.trim().replace(',', '.'));
  return text.trim() && Number.isFinite(value) && value >= 0 ? value : null;
};

/** Drag-sideways number inputs: a compact cell and a big field. */
export function ScrubDemo() {
  const [value, setValue] = useState<number | null>(120);

  return (
    <section>
      <h2>Scrub</h2>
      <div style={{ width: '7rem' }}>
        <ScrubCell
          aria-label='Demo scrub cell'
          format={String}
          onChange={setValue}
          parse={parse}
          placeholder={null}
          tiers={TIERS}
          unit='g'
          value={value}
        />
      </div>
      <ScrubField
        fallback={0}
        label='Demo scrub field'
        onChange={setValue}
        tiers={TIERS}
        unit='g'
        value={value}
      />
    </section>
  );
}

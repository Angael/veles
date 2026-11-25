import { useRef, useState } from 'react';
import { getFoodBarcode } from '@/lib/foodBarcode';

export type LookupState =
  | { status: 'idle' }
  | { barcode: string; status: 'lookingUp' | 'notFound' | 'error' | 'invalid' };

/**
 * Runs one barcode lookup at a time and tracks its progress for `LookupNotice`. Typed GS1 data
 * (e.g. the `(01)…(17)…` line under a DataBar) is reduced to its GTIN first. `find` resolves
 * `true` when it handled a match, `false` for an unknown barcode, and throws on failure.
 */
export function useBarcodeLookup(find: (barcode: string) => Promise<boolean>) {
  const busy = useRef(false);
  const [lookup, setLookup] = useState<LookupState>({ status: 'idle' });

  async function lookupBarcode(input: string) {
    if (!input.trim() || busy.current) return;
    const barcode = getFoodBarcode(input);
    if (!barcode) {
      setLookup({ barcode: input.trim(), status: 'invalid' });
      return;
    }
    busy.current = true;
    setLookup({ barcode, status: 'lookingUp' });
    try {
      setLookup((await find(barcode)) ? { status: 'idle' } : { barcode, status: 'notFound' });
    } catch {
      setLookup({ barcode, status: 'error' });
    } finally {
      busy.current = false;
    }
  }

  return { dismiss: () => setLookup({ status: 'idle' }), lookup, lookupBarcode };
}

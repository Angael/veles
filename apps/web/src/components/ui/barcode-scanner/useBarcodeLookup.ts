import { useRef, useState } from 'react';

export type LookupState =
  | { status: 'idle' }
  | { barcode: string; status: 'lookingUp' | 'notFound' | 'error' };

/**
 * Runs one barcode lookup at a time and tracks its progress for `LookupNotice`. `find` resolves
 * `true` when it handled a match, `false` for an unknown barcode, and throws on failure.
 */
export function useBarcodeLookup(find: (barcode: string) => Promise<boolean>) {
  const busy = useRef(false);
  const [lookup, setLookup] = useState<LookupState>({ status: 'idle' });

  async function lookupBarcode(barcode: string) {
    if (!barcode || busy.current) return;
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

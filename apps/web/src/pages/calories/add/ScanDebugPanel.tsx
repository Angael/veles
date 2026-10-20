import { useState, useSyncExternalStore } from 'react';
import { buildDebugReport, debugLog, getDebugEntryCount, subscribeDebugLog } from './scanDebug';
import css from './ScanDebugPanel.module.css';

/** Temporary fixed panel that copies the scanner debug report for bug reports. */
export function ScanDebugPanel() {
  const count = useSyncExternalStore(subscribeDebugLog, getDebugEntryCount, () => 0);
  const [copied, setCopied] = useState('');
  const [open, setOpen] = useState(false);

  async function copy() {
    const report = buildDebugReport();
    try {
      await navigator.clipboard.writeText(report);
      setCopied('Copied');
    } catch (error) {
      debugLog('clipboard.error', error);
      setOpen(true);
      setCopied('Copy failed, select the text below');
    }
  }

  return (
    <div className={css.panel}>
      <div className={css.row}>
        <span>Debug: {count} events</span>
        <button onClick={() => void copy()} type='button'>
          Copy debug
        </button>
        <button onClick={() => setOpen((value) => !value)} type='button'>
          {open ? 'Hide' : 'Show'}
        </button>
        {copied ? <span>{copied}</span> : null}
      </div>
      {open ? <textarea readOnly value={buildDebugReport()} /> : null}
    </div>
  );
}

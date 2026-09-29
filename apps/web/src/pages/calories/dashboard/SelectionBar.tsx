import { XIcon } from 'lucide-react';
import type { CalorieLog } from '../calories.api';
import { DeleteLogsDialog } from './DeleteLogsDialog';
import { MultiplyLogsDialog } from './MultiplyLogsDialog';
import { ShareLogsDialog } from './ShareLogsDialog';
import { Btn } from '@/components/ui/btn/Btn';
import css from './SelectionBar.module.css';

type Props = {
  logs: CalorieLog[];
  onClear: () => void;
};

/** Floating bar that takes the Log food button's place while logs are selected. */
export function SelectionBar({ logs, onClear }: Props) {
  return (
    <div aria-label='Selected products' className={css.bar} role='toolbar'>
      <Btn
        aria-label='Clear selection'
        icon={<XIcon aria-hidden='true' />}
        iconOnly
        onClick={onClear}
        radius='pill'
        variant='ghost'
      />
      <span aria-live='polite' className={css.count}>
        {logs.length} selected
      </span>
      <MultiplyLogsDialog logs={logs} onMultiplied={onClear} />
      <DeleteLogsDialog logs={logs} onDeleted={onClear} />
      <ShareLogsDialog count={logs.length} onShared={onClear} />
    </div>
  );
}

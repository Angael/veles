import { XIcon } from 'lucide-react';
import { ShareLogsDialog } from './ShareLogsDialog';
import { Btn } from '@/components/ui/btn/Btn';
import css from './SelectionBar.module.css';

type Props = {
  count: number;
  onClear: () => void;
};

/** Floating bar that takes the Log food button's place while logs are selected. */
export function SelectionBar({ count, onClear }: Props) {
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
        {count} selected
      </span>
      <ShareLogsDialog count={count} onShared={onClear} />
    </div>
  );
}

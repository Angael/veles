import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import type { ReactElement, ReactNode } from 'react';
import css from './Tooltip.module.css';

type TooltipProps = {
  /** The element the tooltip describes; rendered as the trigger. */
  children: ReactElement;
  content: ReactNode;
  disabled?: boolean;
  side?: 'top' | 'bottom' | 'left' | 'right';
};

/** Short hover/focus label above a control. Touch screens don't open it, so never hide actions here. */
export function Tooltip({ children, content, disabled, side = 'top' }: TooltipProps) {
  return (
    <BaseTooltip.Root disabled={disabled}>
      <BaseTooltip.Trigger delay={400} render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner className={css.positioner} side={side} sideOffset={6}>
          <BaseTooltip.Popup className={css.popup}>{content}</BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

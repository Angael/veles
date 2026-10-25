import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { type ReactElement, type ReactNode, useEffect, useRef, useState } from 'react';
import css from './Tooltip.module.css';

const longPressMs = 450;
const touchVisibleMs = 1800;

type TooltipProps = {
  /** Trigger element; it must forward its ref and props, like `Btn`. */
  children: ReactElement<Record<string, unknown>>;
  content: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
};

/**
 * Base UI tooltip that also opens on touch long press.
 * Base UI ignores touch on purpose, so on mobile the hint would never show; a hold opens it
 * briefly and swallows the click that follows the release, so the hold does not run the action.
 */
export function Tooltip({ children, content, side = 'top' }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const pressTimer = useRef<number>(undefined);
  const hideTimer = useRef<number>(undefined);
  const longPressed = useRef(false);

  useEffect(
    () => () => {
      window.clearTimeout(pressTimer.current);
      window.clearTimeout(hideTimer.current);
    },
    [],
  );

  const cancelPress = () => window.clearTimeout(pressTimer.current);

  return (
    <BaseTooltip.Root onOpenChange={setOpen} open={open}>
      <BaseTooltip.Trigger
        className={css.trigger}
        onClickCapture={(event) => {
          if (longPressed.current) {
            longPressed.current = false;
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        onContextMenu={(event) => {
          if (longPressed.current) event.preventDefault();
        }}
        onPointerCancel={cancelPress}
        onPointerDown={(event) => {
          longPressed.current = false;
          if (event.pointerType !== 'touch') return;
          cancelPress();
          pressTimer.current = window.setTimeout(() => {
            longPressed.current = true;
            setOpen(true);
            window.clearTimeout(hideTimer.current);
            hideTimer.current = window.setTimeout(() => setOpen(false), touchVisibleMs);
          }, longPressMs);
        }}
        onPointerLeave={cancelPress}
        onPointerUp={cancelPress}
        render={children}
      />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner className={css.positioner} side={side} sideOffset={8}>
          <BaseTooltip.Popup className={css.popup}>
            <BaseTooltip.Arrow className={css.arrow} />
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

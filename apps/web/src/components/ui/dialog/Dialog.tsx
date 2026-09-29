import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type { ComponentProps, ReactNode } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import css from './Dialog.module.css';

export const DialogTrigger = BaseDialog.Trigger;

type DialogProps = {
  body: ReactNode;
  cancelLabel?: ReactNode;
  okButtonProps?: Omit<ComponentProps<typeof Btn>, 'children'>;
  okLabel?: ReactNode;
  onOpenChange?: ComponentProps<typeof BaseDialog.Root>['onOpenChange'];
  open?: boolean;
  title: ReactNode;
  trigger: ReactNode;
};

/** Renders a modal with a standard title, body, and confirm/cancel actions. */
export function Dialog({
  body,
  cancelLabel = 'Cancel',
  okButtonProps,
  okLabel = 'OK',
  onOpenChange,
  open,
  title,
  trigger,
}: DialogProps) {
  return (
    <BaseDialog.Root onOpenChange={onOpenChange} open={open}>
      {trigger}
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={css.backdrop} />
        <BaseDialog.Viewport className={css.viewport}>
          <BaseDialog.Popup className={css.popup}>
            <BaseDialog.Title className={css.title}>{title}</BaseDialog.Title>
            <div className={css.body}>{body}</div>
            <div className={css.actions}>
              <BaseDialog.Close render={<Btn variant='ghost' />}>{cancelLabel}</BaseDialog.Close>
              <Btn {...okButtonProps}>{okLabel}</Btn>
            </div>
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

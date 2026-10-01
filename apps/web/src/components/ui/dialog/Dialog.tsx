import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import clsx from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';
import css from './Dialog.module.css';

export const DialogRoot = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

/** Portals the modal over a backdrop: centered on desktop, docked to the bottom on phones. */
export function DialogPopup({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof BaseDialog.Popup>) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className={css.backdrop} />
      <BaseDialog.Viewport className={css.viewport}>
        <BaseDialog.Popup className={clsx(css.popup, className)} {...props} />
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  );
}

export function DialogTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof BaseDialog.Title>) {
  return <BaseDialog.Title className={clsx(css.title, className)} {...props} />;
}

export function DialogDescription({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof BaseDialog.Description>) {
  return <BaseDialog.Description className={clsx(css.description, className)} {...props} />;
}

/** Right-aligned button row; put the cancel `DialogClose` first and the confirm action last. */
export function DialogActions({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={clsx(css.actions, className)} {...props} />;
}

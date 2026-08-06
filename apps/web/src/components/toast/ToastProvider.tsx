import { Toast } from '@base-ui/react/toast';
import { XIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { toastManager } from './toastManager';
import css from './ToastProvider.module.css';

type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <Toast.Provider toastManager={toastManager}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className={css.viewport}>
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();

  return toasts.map((toast) => (
    <Toast.Root className={css.toast} key={toast.id} toast={toast}>
      <Toast.Content className={css.content}>
        <div className={css.text}>
          <Toast.Title className={css.title} />
          <Toast.Description className={css.description} />
        </div>
        <Toast.Close aria-label='Dismiss notification' className={css.close}>
          <XIcon aria-hidden='true' size={16} strokeWidth={2} />
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
}

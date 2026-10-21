import { Toast } from '@base-ui/react/toast';
import { XIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { toastManager } from './toastManager';
import css from './ToastProvider.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

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
  const { t } = useI18n();

  return toasts.map((toast) => (
    // Phones anchor toasts to the top (swipe up), desktop to the bottom (swipe down).
    <Toast.Root
      className={css.toast}
      key={toast.id}
      swipeDirection={['up', 'down', 'left', 'right']}
      toast={toast}
    >
      <Toast.Content className={css.content}>
        <div className={css.text}>
          <Toast.Title className={css.title} />
          <Toast.Description className={css.description} />
        </div>
        <Toast.Close
          aria-label={t({ en: 'Dismiss notification', pl: 'Zamknij powiadomienie' })}
          className={css.close}
        >
          <XIcon aria-hidden='true' size={16} strokeWidth={2} />
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
}

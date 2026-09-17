import { useNavigate, type UseNavigateResult } from '@tanstack/react-router';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { TypedFormData } from './TypedFormData';
import css from './TypedForm.module.css';

type TypedFormProps = Omit<ComponentPropsWithoutRef<'form'>, 'onSubmit'> & {
  errorMsg?: ReactNode;
  onSubmit: (data: TypedFormData, navigate: UseNavigateResult<string>) => void | Promise<void>;
};

export function TypedForm({ children, errorMsg, onSubmit, ...props }: TypedFormProps) {
  const navigate = useNavigate();

  return (
    <form
      {...props}
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(new TypedFormData(event.currentTarget), navigate);
      }}
    >
      {errorMsg ? (
        <p className={css.error} role='alert'>
          {errorMsg}
        </p>
      ) : null}
      {children}
    </form>
  );
}

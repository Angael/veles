import { useNavigate, type UseNavigateResult } from '@tanstack/react-router';
import type { ComponentPropsWithoutRef } from 'react';
import { TypedFormData } from '@/lib/typedFormData';

type TypedFormProps = Omit<ComponentPropsWithoutRef<'form'>, 'onSubmit'> & {
  onSubmit: (data: TypedFormData, navigate: UseNavigateResult<string>) => void | Promise<void>;
};

export function TypedForm({ onSubmit, ...props }: TypedFormProps) {
  const navigate = useNavigate();

  return (
    <form
      {...props}
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(new TypedFormData(event.currentTarget), navigate);
      }}
    />
  );
}

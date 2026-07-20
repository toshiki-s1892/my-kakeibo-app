'use client';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RequiredLabel } from './RequiredLabel';

type NameFieldProps = {
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  errors?: Array<{ message?: string } | undefined>;
};

export function NameField({
  required = false,
  value,
  onChange,
  errors,
  ...props
}: NameFieldProps & Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'>) {
  const hasError = !!errors?.some((error) => error?.message);

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor="name">
        表示名
        {required && <RequiredLabel />}
      </FieldLabel>
      <Input
        {...props}
        id="name"
        value={value ?? ''}
        onChange={(event) => onChange?.(event.target.value)}
        aria-invalid={hasError}
        placeholder="例：かけぼ太郎"
        autoComplete="off"
      />
      <FieldError errors={errors} />
    </Field>
  );
}

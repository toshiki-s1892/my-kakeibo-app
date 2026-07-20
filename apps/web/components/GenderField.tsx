'use client';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { GENDER_OPTIONS } from '@repo/common';
import { RequiredLabel } from './RequiredLabel';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

type GenderFieldProps = {
  required?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  errors?: Array<{ message?: string } | undefined>;
};

export function GenderField({ required = false, value, onChange, errors }: GenderFieldProps) {
  const hasError = !!errors?.some((error) => error?.message);

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor="gender">
        性別
        {required && <RequiredLabel />}
      </FieldLabel>
      <ToggleGroup
        variant="outline"
        type="single"
        className="w-full"
        value={value ?? ''}
        onValueChange={onChange}
        aria-invalid={hasError}
      >
        {GENDER_OPTIONS.map((option) => (
          <ToggleGroupItem className="flex-1" key={option.value} value={option.value}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <FieldError errors={errors} />
    </Field>
  );
}

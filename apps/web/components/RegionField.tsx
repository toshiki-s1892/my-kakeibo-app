'use client';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { REGION_OPTIONS } from '@repo/common';
import { RequiredLabel } from './RequiredLabel';

type RegionFieldProps = {
  required?: boolean;
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  errors?: Array<{ message?: string } | undefined>;
};

export function RegionField({ required = false, name, value, onChange, errors }: RegionFieldProps) {
  const hasError = !!errors?.some((error) => error?.message);

  return (
    <Field data-invalid={hasError}>
      <FieldLabel htmlFor="regionCode">
        居住地域
        {required && <RequiredLabel />}
      </FieldLabel>
      <Select name={name} value={value ?? ''} onValueChange={onChange}>
        <SelectTrigger id="regionCode" aria-invalid={hasError}>
          <SelectValue placeholder="都道府県を選択してください" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {REGION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <FieldError errors={errors} />
    </Field>
  );
}

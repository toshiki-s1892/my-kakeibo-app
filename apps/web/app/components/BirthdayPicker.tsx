'use client';

import * as React from 'react';

import { cn } from '@/components/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { RequiredLabel } from './RequiredLabel';

type BirthdayPickerProps = {
  required?: boolean;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  errors?: Array<{ message?: string } | undefined>;
};

export function BirthdayPicker({ required = false, value, onChange, errors }: BirthdayPickerProps) {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const hasError = !!errors?.some((error) => error?.message);

  const trigger = (
    <Button
      variant="outline"
      id="date"
      className={cn('justify-start font-normal', !value && 'text-muted-foreground')}
    >
      {value ? value.toLocaleDateString() : '誕生日を選択してください'}
    </Button>
  );

  const calendar = (
    <Calendar
      mode="single"
      selected={value}
      defaultMonth={value}
      timeZone="Asia/Tokyo"
      captionLayout="dropdown"
      disabled={{ after: new Date() }}
      onSelect={(selectedDate) => {
        // 日付が選択されたら React Hook Form に値を渡してPopover/Drawerを閉じる
        if (onChange) {
          onChange(selectedDate);
        }
        setOpen(false);
      }}
    />
  );

  return (
    <Field className="mx-auto" data-invalid={hasError}>
      <FieldLabel htmlFor="date">
        生年月日
        {required && <RequiredLabel />}
      </FieldLabel>
      {isDesktop ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            {calendar}
          </PopoverContent>
        </Popover>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="sr-only">
              <DrawerTitle>生年月日を選択</DrawerTitle>
              <DrawerDescription>カレンダーから生年月日を選択してください</DrawerDescription>
            </DrawerHeader>
            <div className="flex justify-center pb-4">{calendar}</div>
          </DrawerContent>
        </Drawer>
      )}
      <FieldError errors={errors} />
    </Field>
  );
}

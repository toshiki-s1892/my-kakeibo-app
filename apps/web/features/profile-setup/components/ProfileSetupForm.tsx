'use client';
import { BirthdayPicker } from '@/components/BirthdayPicker';
import { GenderField } from '@/components/GenderField';
import { NameField } from '@/components/NameField';
import { RegionField } from '@/components/RegionField';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { AlertCircleIcon, ArrowRight } from 'lucide-react';
import { BaseSyntheticEvent } from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';
import { ProfileSetupFormValues } from '../schema/profileSetupFormSchema';

type ProfileSetupFormProps = {
  form: UseFormReturn<ProfileSetupFormValues>;
  onSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  isPending: boolean;
  submitError: string | null;
  onSignOut: () => void;
};

export const ProfileSetupForm = ({
  form,
  onSubmit,
  isPending,
  submitError,
  onSignOut,
}: ProfileSetupFormProps) => {
  return (
    <Card className="w-full sm:max-w-md p-6">
      <CardHeader className="text-center">
        <CardTitle className="font-bold">ようこそ、かけぼへ</CardTitle>
        <CardDescription>まずはあなたの情報を教えてください</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="profile-setup-form" onSubmit={onSubmit}>
          <FieldGroup>
            {/* 名前入力フォーム */}
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <NameField {...field} required={true} errors={[fieldState.error]} />
              )}
            />

            {/* 性別選択フォーム */}
            <Controller
              name="gender"
              control={form.control}
              render={({ field, fieldState }) => (
                <GenderField {...field} required={true} errors={[fieldState.error]} />
              )}
            />

            {/* 誕生日入力フォーム */}
            <Controller
              name="birthday"
              control={form.control}
              render={({ field, fieldState }) => (
                <BirthdayPicker {...field} required={true} errors={[fieldState.error]} />
              )}
            />

            {/* 居住地選択フォーム */}
            <Controller
              name="regionCode"
              control={form.control}
              render={({ field, fieldState }) => (
                <RegionField {...field} required={true} errors={[fieldState.error]} />
              )}
            />
          </FieldGroup>
        </form>
        {submitError && (
          <Alert variant="destructive" className="mt-5">
            <AlertCircleIcon />
            <AlertDescription>
              <p>{submitError}</p>
              <p className="text-muted-foreground">
                しばらく改善しない場合は、
                <Button variant="link" className="h-auto p-0" onClick={onSignOut}>
                  サインアウト
                </Button>
                して時間をおいてお試しください
              </p>
            </AlertDescription>
          </Alert>
        )}
        <Button
          type="submit"
          form="profile-setup-form"
          className="w-full mt-5"
          disabled={isPending}
        >
          はじめる
          <ArrowRight />
        </Button>
      </CardContent>
    </Card>
  );
};

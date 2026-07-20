import { usePostApiProfileSetup } from '@/lib/api/generated/profile/profile';
import { zodResolver } from '@hookform/resolvers/zod';
import { GENDER_CODE, HTTP_STATUS, unexpectedErrorMessage } from '@repo/common';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { profileSetupFormSchema, ProfileSetupFormValues } from '../schema/profileSetupFormSchema';

export const useProfileSetupForm = () => {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // フォーム定義
  const form = useForm<ProfileSetupFormValues>({
    resolver: zodResolver(profileSetupFormSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      gender: undefined,
      birthday: undefined,
      regionCode: undefined,
    },
  });

  // フォーム値をAPIリクエストボディに変換する
  const toRequestBody = (data: ProfileSetupFormValues) => ({
    name: data.name,
    genderCode: GENDER_CODE[data.gender],
    birthday: data.birthday.toISOString(),
    regionCode: Number(data.regionCode),
  });

  // プロフィール登録APIの呼び出し定義
  const { mutate, isPending } = usePostApiProfileSetup({
    mutation: {
      onSuccess: (response) => {
        // ユーザー登録に成功、またはすでに登録済み（多重タブ・二重送信等）の場合は
        // ダッシュボードに遷移させる（再試行しても解決しないエラーのため）
        if (
          response.status === HTTP_STATUS.NO_CONTENT ||
          response.status === HTTP_STATUS.CONFLICT
        ) {
          router.push('/dashboard');
          return;
        }
        setSubmitError(unexpectedErrorMessage);
      },
      onError: () => {
        setSubmitError(unexpectedErrorMessage);
      },
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    setSubmitError(null);
    mutate({ data: toRequestBody(data) });
  });

  return { form, onSubmit, isPending, submitError };
};

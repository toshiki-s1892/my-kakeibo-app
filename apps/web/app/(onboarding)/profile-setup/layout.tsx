import { isSetupComplete } from '@/server/lib/onboarding';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Clerkの認証情報から userId を取得する
  const { userId } = await auth();

  if (!userId) {
    // 認証されていない場合は、サインイン画面にリダイレクトさせる
    redirect('/sign-in');
  }

  const setupComplete = await isSetupComplete(userId);
  if (setupComplete) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}

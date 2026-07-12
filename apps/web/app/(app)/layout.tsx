import { isSetupComplete } from '@/server/lib/onboarding';
import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function AppLayout({
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

  if (!setupComplete) {
    // プロフィール設定が完了していない場合は、プロフィール登録画面にリダイレクトさせる
    redirect('/profile-setup');
  }

  return (
    <>
      <header className="flex justify-end items-center p-4 gap-4 h-16">
        <UserButton />
      </header>
      {children}
    </>
  );
}

import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { isSetupComplete } from '@/server/lib/onboarding';
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
      <Header />
      <main className="pt-5 pb-20">{children}</main>
      <Footer />
    </>
  );
}

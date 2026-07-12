import { Logo } from '@/components/Logo';
import { SignIn } from '@clerk/nextjs';

export const SigninRoute = () => {
  return (
    <div className="w-full min-w-screen min-h-screen flex flex-col items-center justify-center">
      <Logo />
      <SignIn />
    </div>
  );
};

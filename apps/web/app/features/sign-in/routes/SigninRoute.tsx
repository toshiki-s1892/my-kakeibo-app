import { LogoIcon } from '@/components/icons/LogoIcon';
import { SignIn } from '@clerk/nextjs';

export const SigninRoute = () => {
  return (
    <div className="flex min-h-screen w-full min-w-screen flex-col items-center justify-center">
      <LogoIcon />
      <SignIn />
    </div>
  );
};

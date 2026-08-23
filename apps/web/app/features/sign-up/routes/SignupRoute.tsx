import { LogoIcon } from '@/components/icons/LogoIcon';
import { SignUp } from '@clerk/nextjs';

export const SignupRoute = () => {
  return (
    <div className="flex min-h-screen w-full min-w-screen flex-col items-center justify-center">
      <LogoIcon />
      <h1 className="mb-2 text-2xl font-bold">かけぼへようこそ</h1>
      <SignUp />
    </div>
  );
};

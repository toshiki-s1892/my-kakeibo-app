import { Logo } from '@/components/Logo';
import { SignUp } from '@clerk/nextjs';

export const SignupRoute = () => {
  return (
    <div className="w-full min-w-screen min-h-screen flex flex-col items-center justify-center">
      <Logo />
      <h1 className="text-2xl font-bold mb-2">かけぼへようこそ</h1>
      <SignUp />
    </div>
  );
};

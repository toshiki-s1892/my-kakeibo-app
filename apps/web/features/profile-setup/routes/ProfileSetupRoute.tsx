'use client';
import { Logo } from '@/components/Logo';
import { useClerk } from '@clerk/nextjs';
import { ProfileSetupForm } from '../components/ProfileSetupForm';
import { useProfileSetupForm } from '../hooks/useProfileSetupForm';

export const ProfileSetupRoute = () => {
  const { form, onSubmit, isPending, submitError } = useProfileSetupForm();
  const { signOut } = useClerk();

  return (
    <div className="w-full min-w-screen min-h-screen flex flex-col items-center">
      <Logo />
      <ProfileSetupForm
        form={form}
        onSubmit={onSubmit}
        isPending={isPending}
        submitError={submitError}
        onSignOut={signOut}
      />
    </div>
  );
};

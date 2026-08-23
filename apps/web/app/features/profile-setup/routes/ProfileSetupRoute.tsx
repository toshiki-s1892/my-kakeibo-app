'use client';
import { LogoIcon } from '@/components/icons/LogoIcon';
import { useClerk } from '@clerk/nextjs';
import { ProfileSetupForm } from '../components/ProfileSetupForm';
import { useProfileSetupForm } from '../hooks/useProfileSetupForm';

export const ProfileSetupRoute = () => {
  const { form, onSubmit, isPending, submitError } = useProfileSetupForm();
  const { signOut } = useClerk();

  return (
    <div className="flex min-h-screen w-full min-w-screen flex-col items-center">
      <LogoIcon />
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

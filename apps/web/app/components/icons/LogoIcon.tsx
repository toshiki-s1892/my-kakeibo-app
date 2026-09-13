import Logo from '@/public/icon/logo.svg';

export const LogoIcon = () => {
  return (
    <div className="bg-primary-100 my-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-md">
      <Logo aria-label="logo" />
    </div>
  );
};

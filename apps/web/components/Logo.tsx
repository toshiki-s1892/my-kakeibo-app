import logo from '@/public/icon/logo.svg';
import Image from 'next/image';

export const Logo = () => {
  return (
    <div className="inline-flex items-center justify-center rounded-2xl shadow-md w-14 h-14 bg-primary-100 my-4">
      <Image src={logo} alt="logo" />
    </div>
  );
};

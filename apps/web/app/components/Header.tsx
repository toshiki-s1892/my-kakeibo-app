'use client';
import { UserButton } from '@clerk/nextjs';
import { navItems } from 'app/(app)/nav-items';
import { usePathname } from 'next/navigation';

export const Header = () => {
  const pathname = usePathname();
  const title = navItems.find((item) => pathname.startsWith(item.href))?.label;

  return (
    <header className="md:border-border flex h-16 items-center justify-between p-4 md:border-b md:px-8">
      <h1 className="text-2xl font-bold">{title}</h1>
      <UserButton />
    </header>
  );
};

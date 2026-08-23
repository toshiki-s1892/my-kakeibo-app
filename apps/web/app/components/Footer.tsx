'use client';
import { navItems } from 'app/(app)/nav-items';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Footer = () => {
  const pathname = usePathname();

  return (
    <footer className="bg-background fixed bottom-0 flex h-20 w-full items-center px-6 md:px-16">
      <nav aria-label="メインナビゲーション" className="w-full">
        <ul className="flex justify-between">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li
                key={item.href}
                className={`w-36 rounded-2xl p-1 md:rounded-full md:p-0 ${
                  isActive ? 'bg-primary-300' : 'hover:bg-nav-hover-bg'
                }`}
              >
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col items-center text-[10px] md:py-2 md:text-base ${
                    isActive ? 'font-bold text-white' : 'hover:text-primary-300'
                  }`}
                >
                  <item.icon />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </footer>
  );
};

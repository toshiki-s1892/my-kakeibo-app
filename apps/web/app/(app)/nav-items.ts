import AiIcon from '@/public/icon/ai.svg';
import CategoryIcon from '@/public/icon/category.svg';
import FamilyIcon from '@/public/icon/family.svg';
import HomeIcon from '@/public/icon/home.svg';
import ReceiptIcon from '@/public/icon/receipt.svg';

export const navItems = [
  { href: '/dashboard', label: 'ホーム', icon: HomeIcon },
  { href: '/categories', label: 'カテゴリ管理', icon: CategoryIcon },
  { href: '/transactions', label: '取引記録', icon: ReceiptIcon },
  { href: '/family-members', label: '家族構成管理', icon: FamilyIcon },
  { href: '/advice', label: 'AIアドバイス', icon: AiIcon },
] as const;

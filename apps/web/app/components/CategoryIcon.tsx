import { type LucideProps } from 'lucide-react';

type CategoryIconProps = {
  icon: React.FC<LucideProps>;
  className?: string;
};

export const CategoryIcon = ({ icon: Icon, className }: CategoryIconProps) => {
  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${className}`}>
      <Icon />
    </div>
  );
};

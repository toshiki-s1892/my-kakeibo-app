import { cn } from '@/components/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type OptionTabsProps = {
  options: readonly { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
};

export const OptionTabs = ({ options, value, onValueChange, className }: OptionTabsProps) => (
  <Tabs
    value={value}
    onValueChange={onValueChange}
    className={cn('border-border border-b', className)}
  >
    <TabsList variant="line" className="w-full gap-0 text-base md:w-fit">
      {options.map((option) => (
        <TabsTrigger
          key={option.value}
          value={option.value}
          className="after:bg-primary-300 group-data-[orientation=horizontal]/tabs:after:h-1 md:text-base"
        >
          {option.label}
        </TabsTrigger>
      ))}
    </TabsList>
  </Tabs>
);

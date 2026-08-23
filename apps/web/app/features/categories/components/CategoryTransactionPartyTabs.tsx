import { OptionTabs } from '@/components/OptionTabs';
import { CATEGORY_TABS } from '../categoryTab';

type CategoryTransactionPartyTabsProps = {
  value: string;
  onValueChange: (value: string) => void;
};

export const CategoryTransactionPartyTabs = ({
  value,
  onValueChange,
}: CategoryTransactionPartyTabsProps) => (
  <OptionTabs options={CATEGORY_TABS} value={value} onValueChange={onValueChange} />
);

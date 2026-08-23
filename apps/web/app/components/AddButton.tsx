import AddIcon from '@/public/icon/add.svg';
import { Button } from './ui/button';

type AddButtonProps = {
  className?: string;
};

export const AddButton = ({ className }: AddButtonProps) => {
  return (
    <Button className={className}>
      <AddIcon />
      新しいカテゴリを追加
    </Button>
  );
};

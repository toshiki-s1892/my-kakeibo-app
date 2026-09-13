import AddIcon from '@/public/icon/add.svg';
import { Button } from './ui/button';

type AddButtonProps = {
  className?: string;
  onClick?: () => void;
};

export const AddButton = ({ className, onClick }: AddButtonProps) => {
  return (
    <Button className={className} onClick={onClick}>
      <AddIcon />
      新しいカテゴリを追加
    </Button>
  );
};

import { Link } from '@tanstack/react-router';
import { BarcodeIcon, PlusIcon, ScanLineIcon, SparklesIcon } from 'lucide-react';
import { FloatingButton } from '@/components/floating-button/FloatingButton';
import {
  MenuBtn,
  MenuBtnChevron,
  MenuBtnDivider,
  MenuBtnItem,
  MenuBtnPopup,
  MenuBtnRoot,
} from '@/components/menu-btn/MenuBtn';

type Props = { date: string };

const loggingActions = [
  {
    description: 'Search your foods and choose a serving',
    icon: PlusIcon,
    label: 'Add food',
    to: '/calories/add' as const,
  },
  {
    description: 'Use the camera or enter a barcode',
    icon: ScanLineIcon,
    label: 'Scan barcode',
    to: '/calories/scan' as const,
  },
  {
    description: 'Enter calories and macros directly',
    icon: SparklesIcon,
    label: 'Quick add',
    to: '/calories/quick-add' as const,
  },
];

export function LogFoodMenu({ date }: Props) {
  return (
    <MenuBtnRoot>
      <FloatingButton icon={<PlusIcon aria-hidden='true' />} render={<MenuBtn />}>
        Log food
        <MenuBtnChevron />
      </FloatingButton>
      <MenuBtnPopup
        aria-label='Log food'
        description='Choose how you want to add this entry.'
        heading='Log food'
      >
        {loggingActions.map((action) => {
          const ActionIcon = action.icon;
          return (
            <MenuBtnItem
              description={action.description}
              icon={<ActionIcon aria-hidden='true' />}
              key={action.to}
              label={action.label}
              render={<Link search={{ date }} to={action.to} />}
            />
          );
        })}
        <MenuBtnDivider />
        <MenuBtnItem
          description='Save nutrition details for reuse'
          icon={<BarcodeIcon aria-hidden='true' />}
          label='Create a new food'
          render={<Link search={{ date }} to='/calories/foods/new' />}
        />
      </MenuBtnPopup>
    </MenuBtnRoot>
  );
}

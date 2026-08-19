import { Menu } from '@base-ui/react/menu';
import { Link } from '@tanstack/react-router';
import { BarcodeIcon, ChevronDownIcon, PlusIcon, ScanLineIcon, SparklesIcon } from 'lucide-react';
import { Btn } from '@/components/btn/Btn';
import css from './LogFoodMenu.module.css';

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
    <Menu.Root>
      <Menu.Trigger
        render={
          <Btn className={css.trigger} icon={<PlusIcon aria-hidden='true' />} radius='pill' />
        }
      >
        Log food
        <ChevronDownIcon aria-hidden='true' className={css.chevron} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align='end' className={css.positioner} sideOffset={8}>
          <Menu.Popup aria-label='Log food' className={css.popup}>
            <div className={css.mobileHeading}>
              <strong>Log food</strong>
              <span>Choose how you want to add this entry.</span>
            </div>
            {loggingActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <Menu.Item
                  className={css.item}
                  key={action.to}
                  render={<Link search={{ date }} to={action.to} />}
                >
                  <span className={css.itemIcon}>
                    <ActionIcon aria-hidden='true' />
                  </span>
                  <span className={css.itemCopy}>
                    <strong>{action.label}</strong>
                    <span>{action.description}</span>
                  </span>
                </Menu.Item>
              );
            })}
            <Menu.Separator className={css.separator} />
            <Menu.Item
              className={css.item}
              render={<Link search={{ date }} to='/calories/foods/new' />}
            >
              <span className={css.itemIcon}>
                <BarcodeIcon aria-hidden='true' />
              </span>
              <span className={css.itemCopy}>
                <strong>Create a new food</strong>
                <span>Save nutrition details for reuse</span>
              </span>
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

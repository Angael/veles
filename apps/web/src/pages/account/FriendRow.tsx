import { Avatar } from '@base-ui/react/avatar';
import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton/Skeleton';
import { getInitials } from '@/lib/getInitials';
import css from './AccountPage.module.css';

type FriendRowProps = {
  actions?: ReactNode;
  detail: string;
  image?: string | null;
  name: string;
};

export function FriendRow({ actions, detail, image, name }: FriendRowProps) {
  return (
    <li className={css.friendRow}>
      {image !== undefined ? (
        <Avatar.Root className={css.friendAvatar}>
          {image ? <Avatar.Image alt='' className={css.avatarImage} src={image} /> : null}
          <Avatar.Fallback className={css.friendFallback}>{getInitials(name)}</Avatar.Fallback>
        </Avatar.Root>
      ) : null}
      <div className={css.friendInfo}>
        <strong>{name}</strong>
        <span>{detail}</span>
      </div>
      {actions ? <div className={css.rowActions}>{actions}</div> : null}
    </li>
  );
}

export function FriendRowSkeleton() {
  return (
    <li className={css.friendRow}>
      <Skeleton className={css.friendAvatar} />
      <div className={css.loadingInfo}>
        <Skeleton className={css.loadingName} />
        <Skeleton className={css.loadingMeta} />
      </div>
    </li>
  );
}

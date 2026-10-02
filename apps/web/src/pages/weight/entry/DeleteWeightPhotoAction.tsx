import { useRouter } from '@tanstack/react-router';
import { Trash2Icon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import {
  DialogActions,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog/Dialog';
import { useDeleteWeightPhotoMutation } from '../weight.query';
import css from './WeightEntryPage.module.css';

type DeleteWeightPhotoActionProps = {
  label: string;
  photoId: string;
};

/** Confirms removal of one photo; the weight measurement itself is never touched. */
export function DeleteWeightPhotoAction({ label, photoId }: DeleteWeightPhotoActionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const mutation = useDeleteWeightPhotoMutation();

  function confirm() {
    mutation.mutate(
      { data: { id: photoId } },
      {
        onSuccess: () => {
          setOpen(false);
          void router.invalidate().catch(() => undefined);
        },
      },
    );
  }

  return (
    <DialogRoot onOpenChange={setOpen} open={open}>
      <Btn
        aria-label={`Remove ${label}`}
        className={css.removeButton}
        icon={<XIcon aria-hidden='true' size={14} strokeWidth={2} />}
        iconOnly
        render={<DialogTrigger />}
        size='sm'
        type='button'
        variant='ghost'
      />
      <DialogPopup>
        <DialogTitle>Remove this photo?</DialogTitle>
        <DialogDescription>
          The photo is deleted permanently. Your weight for this day stays saved.
        </DialogDescription>
        <DialogActions>
          <DialogClose render={<Btn variant='ghost' />}>Cancel</DialogClose>
          <Btn
            icon={<Trash2Icon aria-hidden='true' />}
            loading={mutation.isPending}
            onClick={confirm}
            variant='danger'
          >
            Remove
          </Btn>
        </DialogActions>
      </DialogPopup>
    </DialogRoot>
  );
}

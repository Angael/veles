import { useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { UploadTileGrid } from '@/components/ui/upload-tile-grid/UploadTileGrid';
import { useAddWeightPhotosMutation } from '../weight.query';
import { WEIGHT_PHOTO_MAX_BYTES } from '../weightPhotos.api';
import css from './WeightEntryPage.module.css';

type AddWeightPhotosFormProps = {
  date: string;
  maxItems: number;
};

/** Uploads photos to an existing entry; failed uploads keep the selection for a retry. */
export function AddWeightPhotosForm({ date, maxItems }: AddWeightPhotosFormProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const mutation = useAddWeightPhotosMutation();

  async function handleSubmit() {
    setError(null);
    const formData = new FormData();
    formData.append('date', date);

    for (const photo of photos) {
      formData.append('photos', photo);
    }

    try {
      await mutation.mutateAsync({ data: formData });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Photo upload failed.');
      return;
    }

    setPhotos([]);
    await router.invalidate().catch(() => undefined);
  }

  return (
    <TypedForm className={css.addForm} errorMsg={error} onSubmit={handleSubmit}>
      <UploadTileGrid
        files={photos}
        maxItemSize={WEIGHT_PHOTO_MAX_BYTES}
        maxItems={maxItems}
        onFilesChange={setPhotos}
      />
      {photos.length > 0 ? (
        <Btn className={css.uploadButton} loading={mutation.isPending} type='submit'>
          Upload {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
        </Btn>
      ) : null}
    </TypedForm>
  );
}

import { UploadTileGrid } from '@/components/ui/upload-tile-grid/UploadTileGrid';
import type { OrderedPhoto } from '@/lib/storage/orderedPhotos';
import { RECIPE_UPLOAD_MAX_PHOTO_BYTES, RECIPE_UPLOAD_MAX_PHOTO_COUNT } from '../recipeUpload.api';
import css from './RecipeForm.module.css';

type RecipePhotosFieldProps = {
  onPhotosChange: (photos: OrderedPhoto[]) => void;
  photos: OrderedPhoto[];
};

export function RecipePhotosField({ onPhotosChange, photos }: RecipePhotosFieldProps) {
  return (
    <div className={css.photos}>
      <span>Photos</span>
      <UploadTileGrid
        maxItemSize={RECIPE_UPLOAD_MAX_PHOTO_BYTES}
        maxItems={RECIPE_UPLOAD_MAX_PHOTO_COUNT}
        onPhotosChange={onPhotosChange}
        photos={photos}
      />
    </div>
  );
}

import { useState } from 'react';
import { UploadTileGrid } from '@/components/ui/upload-tile-grid/UploadTileGrid';
import type { OrderedPhoto } from '@/lib/storage/orderedPhotos';

export function UploadTileGridDemo() {
  const [photos, setPhotos] = useState<OrderedPhoto[]>([]);

  return (
    <section>
      <h2>UploadTileGrid</h2>
      <UploadTileGrid
        maxItemSize={10 * 1024 * 1024}
        maxItems={4}
        onPhotosChange={setPhotos}
        photos={photos}
      />
    </section>
  );
}

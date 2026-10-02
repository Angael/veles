import { useState } from 'react';
import { UploadTileGrid } from '@/components/ui/upload-tile-grid/UploadTileGrid';

export function UploadTileGridDemo() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <section>
      <h2>UploadTileGrid</h2>
      <UploadTileGrid
        files={files}
        maxItemSize={10 * 1024 * 1024}
        maxItems={4}
        onFilesChange={setFiles}
      />
    </section>
  );
}

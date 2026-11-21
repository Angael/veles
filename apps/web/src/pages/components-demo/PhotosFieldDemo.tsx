import { CameraIcon, ImagesIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { usePhotoSource } from '@/components/ui/photo-source/usePhotoSource';
import { PhotosField } from '@/components/ui/photos-field/PhotosField';

export function PhotosFieldDemo() {
  const [picked, setPicked] = useState<string[]>([]);
  const photoSource = usePhotoSource({
    multiple: true,
    onFiles: (files) => setPicked(files.map((file) => file.name)),
  });

  return (
    <section>
      <h2>PhotosField</h2>
      <PhotosField maxCount={4} />
      <h2>usePhotoSource</h2>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Btn
          className={photoSource.cameraClassName}
          icon={<CameraIcon aria-hidden='true' />}
          onClick={photoSource.openCamera}
          type='button'
        >
          Camera
        </Btn>
        <Btn
          icon={<ImagesIcon aria-hidden='true' />}
          onClick={photoSource.openGallery}
          type='button'
          variant='white'
        >
          Gallery
        </Btn>
      </div>
      <p>{picked.length ? picked.join(', ') : 'No files picked'}</p>
      {photoSource.inputs}
    </section>
  );
}

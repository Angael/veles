import { type ReactNode, useRef } from 'react';
import css from './usePhotoSource.module.css';

type PhotoSourceOptions = {
  multiple?: boolean;
  onFiles: (files: File[]) => void;
};

type PhotoSource = {
  /** Add to the camera button: desktops have no capture camera, so it hides on fine pointers. */
  cameraClassName: string | undefined;
  /** Render once, anywhere inside the component. */
  inputs: ReactNode;
  openCamera: () => void;
  openGallery: () => void;
};

/**
 * The only place that renders image file inputs. Phones need two inputs to offer both sources:
 * with `capture`, the browser opens only the camera; without it, Android opens the system photo
 * picker, which has no camera. So every photo UI shows a camera button and a gallery button.
 */
export function usePhotoSource({ multiple = false, onFiles }: PhotoSourceOptions): PhotoSource {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function input(ref: typeof cameraRef, capture?: 'environment') {
    return (
      <input
        accept='image/*'
        aria-hidden='true'
        capture={capture}
        className={css.input}
        multiple={multiple}
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? []);
          event.currentTarget.value = '';
          if (files.length > 0) onFiles(files);
        }}
        ref={ref}
        tabIndex={-1}
        type='file'
      />
    );
  }

  return {
    cameraClassName: css.camera,
    inputs: (
      <>
        {input(cameraRef, 'environment')}
        {input(galleryRef)}
      </>
    ),
    openCamera: () => cameraRef.current?.click(),
    openGallery: () => galleryRef.current?.click(),
  };
}

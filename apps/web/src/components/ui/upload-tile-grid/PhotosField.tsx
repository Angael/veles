import type { ComponentProps } from 'react';
import css from './PhotosField.module.css';
import { UploadTileGrid } from './UploadTileGrid';

type PhotosFieldProps = ComponentProps<typeof UploadTileGrid> & {
  label?: string;
};

/** Labelled `UploadTileGrid` for forms. */
export function PhotosField({ label = 'Photos', ...gridProps }: PhotosFieldProps) {
  return (
    <div className={css.root}>
      <span>{label}</span>
      <UploadTileGrid {...gridProps} />
    </div>
  );
}

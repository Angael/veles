import { useState } from 'react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import { DateInput } from '@/components/date-input/DateInput';
import { Label } from '@/components/label/Label';
import { SeamlessTextInput } from '@/components/seamless-text-input/SeamlessTextInput';
import { SeamlessTextarea } from '@/components/seamless-textarea/SeamlessTextarea';
import { Skeleton } from '@/components/skeleton/Skeleton';
import { TextareaInput } from '@/components/textarea-input/TextareaInput';
import { toastManager } from '@/components/toast/toastManager';
import { UploadTileGrid } from '@/components/upload-tile-grid/UploadTileGrid';
import css from './ComponentsDemoPage.module.css';

/** Showcases the shared components added after the original catalog was created. */
export function AdditionalComponentsDemo() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <>
      <section>
        <h2>Labels and inputs</h2>
        <div className={css.formGrid}>
          <Label text='DateInput'>
            <DateInput defaultValue='2026-08-08' />
          </Label>
          <Label text='TextareaInput'>
            <TextareaInput defaultValue='A standard multiline field.' rows={3} />
          </Label>
        </div>
      </section>

      <section>
        <h2>Seamless fields</h2>
        <Card className={css.seamlessCard}>
          <SeamlessTextInput aria-label='Demo seamless title' defaultValue='Editable card title' />
          <SeamlessTextarea
            aria-label='Demo seamless description'
            defaultValue='These controls inherit the surrounding surface instead of drawing their own.'
            rows={3}
          />
        </Card>
      </section>

      <section>
        <h2>Skeleton</h2>
        <Card className={css.skeletonCard}>
          <Skeleton className={css.skeletonTitle} />
          <Skeleton className={css.skeletonLine} />
          <Skeleton className={css.skeletonShortLine} />
        </Card>
      </section>

      <section>
        <h2>Toast</h2>
        <Btn
          onClick={() =>
            toastManager.add({
              description: 'The global provider renders this notification.',
              title: 'Demo toast',
              type: 'success',
            })
          }
          type='button'
          variant='outlineMain'
        >
          Show toast
        </Btn>
      </section>

      <section>
        <h2>UploadTileGrid</h2>
        <UploadTileGrid
          files={files}
          maxItemSize={5 * 1024 * 1024}
          maxItems={4}
          onFilesChange={setFiles}
        />
      </section>
    </>
  );
}

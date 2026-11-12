import { useEffect, useRef, useState } from 'react';
import { shrinkPhoto } from './photoScanFiles';

export type PhotoShot = { file: File; id: number; url: string };

/**
 * Keeps the photos taken so far. Each one is shrunk right away, so many camera files do not
 * fill the phone's memory; previews are released when the form goes away.
 */
export function usePhotoShots(maxCount: number) {
  const [shots, setShots] = useState<PhotoShot[]>([]);
  const [processing, setProcessing] = useState(0);
  const nextId = useRef(0);
  const urls = useRef(new Set<string>());

  useEffect(() => {
    const ownedUrls = urls.current;
    return () => {
      for (const url of ownedUrls) URL.revokeObjectURL(url);
      ownedUrls.clear();
    };
  }, []);

  async function add(files: File[]) {
    const accepted = files.slice(0, Math.max(0, maxCount - shots.length - processing));
    setProcessing((count) => count + accepted.length);
    await Promise.all(
      accepted.map(async (original) => {
        const file = await shrinkPhoto(original);
        const url = URL.createObjectURL(file);
        urls.current.add(url);
        const id = nextId.current++;
        setShots((current) => [...current, { file, id, url }]);
        setProcessing((count) => count - 1);
      }),
    );
  }

  function remove(shot: PhotoShot) {
    URL.revokeObjectURL(shot.url);
    urls.current.delete(shot.url);
    setShots((current) => current.filter((item) => item.id !== shot.id));
  }

  return { add, processing, remove, shots };
}

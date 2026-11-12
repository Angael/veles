const maxPhotoSide = 1600;

/**
 * Shrinks a camera photo before upload. Phone photos are often 5+ MB, and two of them
 * would pass the upload limit; 1600 px keeps small label text readable for the AI.
 */
export async function shrinkPhoto(photo: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(photo);
    try {
      const scale = Math.min(1, maxPhotoSide / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.85),
      );
      return blob ? new File([blob], 'photo.jpg', { type: 'image/jpeg' }) : photo;
    } finally {
      bitmap.close();
    }
  } catch {
    return photo;
  }
}

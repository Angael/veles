import { describe, expect, it } from 'vitest';
import {
  areUploadFilesEqual,
  formatUploadFileMeta,
  getUploadFileKey,
  isUploadImageFile,
  mergeUploadFiles,
} from './uploadFileSelection';

function imageFile(contents: string, name = 'photo.png', lastModified = 1) {
  return new File([contents], name, { lastModified, type: 'image/png' });
}

describe('upload file selection', () => {
  it('retains distinct files with colliding browser metadata and removes by object identity', () => {
    const first = imageFile('a');
    const second = imageFile('b');
    const result = mergeUploadFiles({
      currentFiles: [first],
      incomingFiles: [second],
      maxItemSize: 10,
      maxItems: 2,
    });

    expect(result).toEqual({ files: [first, second], rejectedCount: 0 });
    expect(getUploadFileKey(first)).not.toBe(getUploadFileKey(second));
    expect(result.files.filter((file) => file !== first)).toEqual([second]);
  });

  it('deduplicates only repeated references and preserves stable keys', () => {
    const file = imageFile('a');
    const key = getUploadFileKey(file);
    const result = mergeUploadFiles({
      currentFiles: [file],
      incomingFiles: [file],
      maxItemSize: 10,
      maxItems: 2,
    });

    expect(result).toEqual({ files: [file], rejectedCount: 0 });
    expect(getUploadFileKey(file)).toBe(key);
    expect(areUploadFilesEqual(result.files, [file])).toBe(true);
    expect(areUploadFilesEqual(result.files, [imageFile('a')])).toBe(false);
  });

  it('accepts exact limits and reports files exceeding size or count', () => {
    const first = imageFile('a');
    const exactSize = imageFile('12');
    const oversized = imageFile('123');
    const result = mergeUploadFiles({
      currentFiles: [first],
      incomingFiles: [exactSize, oversized],
      maxItemSize: 2,
      maxItems: 2,
    });

    expect(result).toEqual({ files: [first, exactSize], rejectedCount: 1 });
  });

  it('uses the same MIME-based image policy as the server', () => {
    expect(isUploadImageFile(new File(['x'], 'photo.jpg', { type: '' }))).toBe(false);
    expect(isUploadImageFile(new File(['x'], 'photo', { type: 'image/jpeg' }))).toBe(true);
    expect(isUploadImageFile(new File(['x'], 'photo.jpg', { type: 'text/plain' }))).toBe(false);
  });

  it.each([
    [new File(['x'], 'photo', { type: 'image/png' }), 'PNG • 1 B'],
    [new File(['x'], '.hidden', { type: 'image/jpeg' }), 'JPEG • 1 B'],
    [new File(['x'], 'photo.', { type: 'image/webp' }), 'WEBP • 1 B'],
    [new File([new Uint8Array(1024)], 'photo.avif', { type: 'image/avif' }), 'AVIF • 1.0 KB'],
  ])('formats useful metadata for %s', (file, expected) => {
    expect(formatUploadFileMeta(file)).toBe(expected);
  });
});

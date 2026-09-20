/** Downloads a URL as a File using the platform's normal redirect handling. */
export async function downloadFile(url: string): Promise<File> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`File download failed with status ${response.status}`);
  }

  const pathname = new URL(response.url || url).pathname;
  const filename = pathname.slice(pathname.lastIndexOf('/') + 1) || 'download';
  const contentType = response.headers.get('content-type')?.split(';', 1)[0]?.trim() || '';
  return new File([await response.arrayBuffer()], filename, { type: contentType });
}

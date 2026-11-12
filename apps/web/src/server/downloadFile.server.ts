const DOWNLOAD_TIMEOUT_MS = 15_000;

/**
 * Downloads a URL as a File using the platform's normal redirect handling.
 * Times out and stops reading past `maxBytes`, so a slow or huge third-party response
 * cannot hold the request or fill memory.
 */
export async function downloadFile(url: string, maxBytes: number): Promise<File> {
  const response = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`File download failed with status ${response.status}`);
  }

  const declaredLength = Number(response.headers.get('content-length'));
  if (declaredLength > maxBytes) {
    await response.body?.cancel();
    throw new Error(`File download is larger than ${maxBytes} bytes`);
  }

  const pathname = new URL(response.url || url).pathname;
  const filename = pathname.slice(pathname.lastIndexOf('/') + 1) || 'download';
  const contentType = response.headers.get('content-type')?.split(';', 1)[0]?.trim() || '';
  return new File(await readLimited(response, maxBytes), filename, { type: contentType });
}

/** Reads a response body into chunks, aborting once it passes `maxBytes`. */
async function readLimited(
  response: Response,
  maxBytes: number,
): Promise<Uint8Array<ArrayBuffer>[]> {
  if (!response.body) return [];

  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let total = 0;
  for await (const chunk of response.body) {
    total += chunk.byteLength;
    if (total > maxBytes) {
      throw new Error(`File download is larger than ${maxBytes} bytes`);
    }
    chunks.push(chunk);
  }
  return chunks;
}

import { lookup as dnsLookup } from 'node:dns';
import type { IncomingMessage } from 'node:http';
import { get as httpsGet } from 'node:https';
import { BlockList, isIP, type LookupFunction } from 'node:net';

const DOWNLOAD_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 3;

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

  const contentType = response.headers.get('content-type');
  const chunks = response.body ? await readLimited(response.body, maxBytes) : [];
  return toFile(chunks, new URL(response.url || url), contentType);
}

/** Addresses a user-given URL must never reach: loopback, private, link-local, and reserved. */
const nonPublicAddresses = new BlockList();
for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 3],
] as const) {
  nonPublicAddresses.addSubnet(network, prefix, 'ipv4');
}
// No ::ffff:0:0/96 rule: BlockList checks IPv4-mapped IPv6 against the IPv4 rules above, and that
// rule would also match every plain IPv4 address.
for (const [network, prefix] of [
  ['::', 127],
  ['64:ff9b::', 96],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  nonPublicAddresses.addSubnet(network, prefix, 'ipv6');
}

function isPublicAddress(address: string) {
  const family = isIP(address);
  return family !== 0 && !nonPublicAddresses.check(address, family === 4 ? 'ipv4' : 'ipv6');
}

/** DNS lookup that fails for non-public addresses; checked at connect time, so rebinding cannot slip past. */
const publicOnlyLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error, options.all ? [] : '');
    const blocked = addresses.find(({ address }) => !isPublicAddress(address));
    const first = addresses[0];
    if (blocked || !first) {
      return callback(new Error(`${hostname} is not a public address`), options.all ? [] : '');
    }
    if (options.all) return callback(null, addresses);
    callback(null, first.address, first.family);
  });
};

/**
 * Downloads a URL that a user or agent supplied. Only public HTTPS hosts are reached, also after
 * redirects, so the server cannot be used to read its own network. Same time and size limits as
 * `downloadFile`.
 */
export async function downloadPublicFile(url: string, maxBytes: number): Promise<File> {
  const signal = AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS);
  let target = new URL(url);

  for (let redirects = 0; ; redirects++) {
    const response = await getPublic(target, signal);
    const status = response.statusCode ?? 0;
    const location = response.headers.location;

    if (status >= 300 && status < 400 && location) {
      response.destroy();
      if (redirects >= MAX_REDIRECTS) throw new Error('File download redirected too many times');
      target = new URL(location, target);
      continue;
    }
    if (status < 200 || status >= 300) {
      response.destroy();
      throw new Error(`File download failed with status ${status}`);
    }
    if (Number(response.headers['content-length']) > maxBytes) {
      response.destroy();
      throw new Error(`File download is larger than ${maxBytes} bytes`);
    }

    return toFile(await readLimited(response, maxBytes), target, response.headers['content-type']);
  }
}

function getPublic(url: URL, signal: AbortSignal) {
  if (url.protocol !== 'https:') throw new Error('Only https URLs can be downloaded');
  // Node skips `lookup` for IP literals, so check those directly.
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(host) && !isPublicAddress(host)) throw new Error(`${host} is not a public address`);

  return new Promise<IncomingMessage>((resolve, reject) => {
    httpsGet(url, { lookup: publicOnlyLookup, signal }, resolve).on('error', reject);
  });
}

function toFile(chunks: Uint8Array<ArrayBuffer>[], url: URL, contentType?: string | null) {
  const filename = url.pathname.slice(url.pathname.lastIndexOf('/') + 1) || 'download';
  const type = contentType?.split(';', 1)[0]?.trim() || '';
  return new File(chunks, filename, { type });
}

/** Reads a body into chunks, aborting once it passes `maxBytes`. */
async function readLimited(
  body: AsyncIterable<Uint8Array<ArrayBuffer>>,
  maxBytes: number,
): Promise<Uint8Array<ArrayBuffer>[]> {
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let total = 0;
  for await (const chunk of body) {
    total += chunk.byteLength;
    if (total > maxBytes) {
      throw new Error(`File download is larger than ${maxBytes} bytes`);
    }
    chunks.push(chunk);
  }
  return chunks;
}

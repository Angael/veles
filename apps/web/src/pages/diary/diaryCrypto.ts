// Browser-only diary encryption. The passphrase and unwrapped key never leave the browser.
import { type } from 'arktype';

export type DiaryKeyRecord = {
  iterations: number;
  salt: string;
  wrappedKey: string;
};

export type DiaryEntryContent = {
  markdown: string;
  title: string;
};

const diaryEntryContentType = type({ markdown: 'string', title: 'string' });
const PBKDF2_ITERATIONS = 600_000;
const SEALED_PREFIX = 'v1';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Creates a random data key for a new diary and wraps it with the passphrase. */
export async function createDiaryKey(passphrase: string) {
  const record: DiaryKeyRecord = {
    iterations: PBKDF2_ITERATIONS,
    salt: toBase64(crypto.getRandomValues(new Uint8Array(16))),
    wrappedKey: '',
  };
  const wrappingKey = await deriveWrappingKey(passphrase, record);
  const dataKey = await crypto.subtle.generateKey({ length: 256, name: 'AES-GCM' }, true, [
    'encrypt',
    'decrypt',
  ]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const wrapped = await crypto.subtle.wrapKey('raw', dataKey, wrappingKey, { iv, name: 'AES-GCM' });
  record.wrappedKey = seal(iv, new Uint8Array(wrapped));

  return { key: await unlockDiaryKey(passphrase, record), record };
}

/**
 * Unwraps the diary data key as a non-extractable key.
 * Throws when the passphrase is wrong, because AES-GCM authentication fails.
 */
export async function unlockDiaryKey(passphrase: string, record: DiaryKeyRecord) {
  const wrappingKey = await deriveWrappingKey(passphrase, record);
  const { data, iv } = unseal(record.wrappedKey);
  return crypto.subtle.unwrapKey(
    'raw',
    data,
    wrappingKey,
    { iv, name: 'AES-GCM' },
    { length: 256, name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Encrypts entry content, bound to its id so ciphertext cannot be moved to another entry. */
export async function encryptDiaryEntry(key: CryptoKey, id: string, content: DiaryEntryContent) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { additionalData: entryAad(id), iv, name: 'AES-GCM' },
    key,
    encoder.encode(JSON.stringify(content)),
  );
  return seal(iv, new Uint8Array(data));
}

/** Decrypts entry content; a null ciphertext is a freshly created empty entry. */
export async function decryptDiaryEntry(
  key: CryptoKey,
  id: string,
  ciphertext: string | null,
): Promise<DiaryEntryContent> {
  if (ciphertext === null) return { markdown: '', title: '' };

  const { data, iv } = unseal(ciphertext);
  const plain = await crypto.subtle.decrypt(
    { additionalData: entryAad(id), iv, name: 'AES-GCM' },
    key,
    data,
  );
  const parsed: unknown = JSON.parse(decoder.decode(plain));
  const { markdown, title } = diaryEntryContentType.assert(parsed);
  return { markdown, title };
}

async function deriveWrappingKey(passphrase: string, record: DiaryKeyRecord) {
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase.normalize('NFC')),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      hash: 'SHA-256',
      iterations: record.iterations,
      name: 'PBKDF2',
      salt: fromBase64(record.salt),
    },
    material,
    { length: 256, name: 'AES-GCM' },
    false,
    ['wrapKey', 'unwrapKey'],
  );
}

function entryAad(id: string) {
  return encoder.encode(`diary_entry:${id}`);
}

function seal(iv: Uint8Array, data: Uint8Array) {
  return `${SEALED_PREFIX}.${toBase64(iv)}.${toBase64(data)}`;
}

function unseal(value: string) {
  const [prefix, iv, data] = value.split('.');
  if (prefix !== SEALED_PREFIX || !iv || !data) {
    throw new Error('Unsupported encrypted diary format.');
  }
  return { data: fromBase64(data), iv: fromBase64(iv) };
}

function toBase64(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

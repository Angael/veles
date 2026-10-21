import { type } from 'arktype';
import { dateOnlyType } from '@/lib/dateOnly';

// Sealed JSON of a 160-char title and 16000-char body, with room for escapes, UTF-8, and base64.
const ciphertextType = type('string <= 200000');

export const updateDiaryEntryInputType = type({
  ciphertext: ciphertextType,
  entryDate: dateOnlyType,
  id: 'string.uuid',
  version: 'number.integer >= 1',
});

import { type } from 'arktype';

export const createNoteInputType = type({
  '+': 'reject',
  content: 'string <= 16000',
  title: 'string.trim |> 0 < string <= 160',
  type: "'note' | 'shopping_list'",
});

/** A note's concurrency token, as read with the note. */
const noteVersionType = 'number.integer >= 1';

export const updateNoteInputType = type({
  '+': 'reject',
  id: 'string.uuid',
  // Required: an update without the version the editor loaded must not skip the conflict check.
  version: noteVersionType,
  'title?': 'string.trim |> 0 < string <= 160',
  'content?': 'string <= 16000',
});

export const deleteNoteInputType = type({ '+': 'reject', id: 'string.uuid' });

export const setNoteSharedInputType = type({ '+': 'reject', id: 'string.uuid', shared: 'boolean' });

export const toggleNoteTypeInputType = type({ '+': 'reject', id: 'string.uuid' });

export const createListItemInputType = type({
  '+': 'reject',
  // Client-generated UUIDv7 so optimistic rows keep their identity; the DB default fills it when omitted.
  'id?': 'string.uuid',
  name: 'string.trim |> 0 < string <= 240',
  noteId: 'string.uuid',
});

export const updateListItemInputType = type({
  '+': 'reject',
  id: 'string.uuid',
  name: 'string.trim |> 0 < string <= 240',
});

export const setListItemCheckedInputType = type({
  '+': 'reject',
  checked: 'boolean',
  id: 'string.uuid',
});

export const deleteListItemInputType = type({ '+': 'reject', id: 'string.uuid' });

const itemNameType = 'string.trim |> 0 < string <= 240';

/** A note with its list changes at once; on update only given fields change. */
export const saveNoteInputType = type({
  '+': 'reject',
  'id?': 'string.uuid',
  // Required on updates that change title, content, or type; checked whenever given.
  'version?': noteVersionType,
  'title?': 'string.trim |> 0 < string <= 160',
  'content?': 'string <= 16000',
  'type?': "'note' | 'shopping_list'",
  'shared?': 'boolean',
  'items?': {
    '+': 'reject',
    'add?': type(itemNameType).array().atMostLength(200),
    'update?': type({
      '+': 'reject',
      id: 'string.uuid',
      'name?': itemNameType,
      'checked?': 'boolean',
    })
      .array()
      .atMostLength(200),
    'remove?': type('string.uuid[]').atMostLength(200),
  },
});

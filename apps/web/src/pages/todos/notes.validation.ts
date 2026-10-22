import { type } from 'arktype';

// Item names may be empty, so a new row can stay blank until the user types its name.
const itemNameType = 'string.trim |> string <= 240';

export const createNoteInputType = type({
  '+': 'reject',
  content: 'string <= 16000',
  // Initial checklist rows, so a list is created with its items in one transaction.
  'items?': type(itemNameType).array().atMostLength(200),
  title: 'string.trim |> 0 < string <= 160',
  type: "'note' | 'shopping_list'",
});

export const updateNoteInputType = type({
  '+': 'reject',
  id: 'string.uuid',
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
  name: itemNameType,
  noteId: 'string.uuid',
});

export const updateListItemInputType = type({
  '+': 'reject',
  id: 'string.uuid',
  name: itemNameType,
});

export const setListItemCheckedInputType = type({
  '+': 'reject',
  checked: 'boolean',
  id: 'string.uuid',
});

export const deleteListItemInputType = type({ '+': 'reject', id: 'string.uuid' });

/** A note with its list changes at once; on update only given fields change. */
export const saveNoteInputType = type({
  '+': 'reject',
  'id?': 'string.uuid',
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

import { type } from 'arktype';

export const createNoteInputType = type({
  '+': 'reject',
  content: 'string <= 16000',
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

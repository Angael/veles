import type { McpServer } from '@modelcontextprotocol/server';
import {
  createNoteRecord,
  updateNoteRecord,
  deleteNoteRecord,
  setNoteSharedRecord,
  toggleNoteTypeRecord,
  createListItemRecord,
  updateListItemRecord,
  setListItemCheckedRecord,
  deleteListItemRecord,
} from '@/pages/todos/notes.server';
import {
  createNoteInputType,
  updateNoteInputType,
  deleteNoteInputType,
  setNoteSharedInputType,
  toggleNoteTypeInputType,
  createListItemInputType,
  updateListItemInputType,
  setListItemCheckedInputType,
  deleteListItemInputType,
} from '@/pages/todos/notes.validation';
import { agentInput, agentWriter, writeAnnotations } from './mcp-tools.server';

/** Note and shopping list writes; each call checks current consent and operates on owned notes. */
export function registerNoteTools(server: McpServer, userId: string) {
  const write = agentWriter(userId, 'notes');

  server.registerTool(
    'create_note',
    {
      description:
        'Create an owned note or shopping list. New notes are private. For shopping lists, add items with create_list_item.',
      inputSchema: agentInput(createNoteInputType),
      annotations: writeAnnotations({ destructive: false, idempotent: false }),
    },
    write(createNoteRecord),
  );
  server.registerTool(
    'update_note',
    {
      description: 'Edit the title or content of an owned note.',
      inputSchema: agentInput(updateNoteInputType),
      annotations: writeAnnotations({ destructive: false, idempotent: true }),
    },
    write(updateNoteRecord),
  );
  server.registerTool(
    'delete_note',
    {
      description: 'Delete an owned note and all its list items.',
      inputSchema: agentInput(deleteNoteInputType),
      annotations: writeAnnotations({ destructive: true, idempotent: false }),
    },
    write(deleteNoteRecord),
  );
  server.registerTool(
    'set_note_shared',
    {
      description: 'Share or unshare an owned note with connected friends.',
      inputSchema: agentInput(setNoteSharedInputType),
      annotations: writeAnnotations({ destructive: false, idempotent: true, openWorld: true }),
    },
    write(setNoteSharedRecord),
  );
  server.registerTool(
    'toggle_note_type',
    {
      description:
        'Convert an owned note to a shopping list or back; converts content and items atomically.',
      inputSchema: agentInput(toggleNoteTypeInputType),
      annotations: writeAnnotations({ destructive: true, idempotent: false }),
    },
    write(toggleNoteTypeRecord),
  );
  server.registerTool(
    'create_list_item',
    {
      description: 'Add an item to an owned shopping list.',
      inputSchema: agentInput(createListItemInputType),
      annotations: writeAnnotations({ destructive: false, idempotent: false }),
    },
    write(createListItemRecord),
  );
  server.registerTool(
    'update_list_item',
    {
      description: 'Rename an item in an owned shopping list.',
      inputSchema: agentInput(updateListItemInputType),
      annotations: writeAnnotations({ destructive: false, idempotent: true }),
    },
    write(updateListItemRecord),
  );
  server.registerTool(
    'set_list_item_checked',
    {
      description: 'Check or uncheck an item in an owned shopping list.',
      inputSchema: agentInput(setListItemCheckedInputType),
      annotations: writeAnnotations({ destructive: false, idempotent: true }),
    },
    write(setListItemCheckedRecord),
  );
  server.registerTool(
    'delete_list_item',
    {
      description: 'Delete an item from an owned shopping list.',
      inputSchema: agentInput(deleteListItemInputType),
      annotations: writeAnnotations({ destructive: true, idempotent: false }),
    },
    write(deleteListItemRecord),
  );
}

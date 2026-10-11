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
import { runAgentTool } from './mcp-tools.server';

type WriteHints = { destructive: boolean; idempotent: boolean; openWorld?: boolean };

const writeAnnotations = (hints: WriteHints) => ({
  readOnlyHint: false,
  destructiveHint: hints.destructive,
  idempotentHint: hints.idempotent,
  openWorldHint: hints.openWorld ?? false,
});

/** Registers the first write feature; each call checks current consent and operates on owned notes. */
export function registerNoteTools(server: McpServer, userId: string) {
  const write =
    <T>(operation: (userId: string, data: T) => Promise<unknown>) =>
    async (data: T) =>
      runAgentTool(userId, 'notes', 'write', () => operation(userId, data));

  server.registerTool(
    'create_note',
    {
      description:
        'Create an owned note or shopping list. New notes are private. For shopping lists, add items with create_list_item.',
      inputSchema: createNoteInputType,
      annotations: writeAnnotations({ destructive: false, idempotent: false }),
    },
    write(createNoteRecord),
  );
  server.registerTool(
    'update_note',
    {
      description: 'Edit the title or content of an owned note.',
      inputSchema: updateNoteInputType,
      annotations: writeAnnotations({ destructive: false, idempotent: true }),
    },
    write(updateNoteRecord),
  );
  server.registerTool(
    'delete_note',
    {
      description: 'Delete an owned note and all its list items.',
      inputSchema: deleteNoteInputType,
      annotations: writeAnnotations({ destructive: true, idempotent: false }),
    },
    write(deleteNoteRecord),
  );
  server.registerTool(
    'set_note_shared',
    {
      description: 'Share or unshare an owned note with connected friends.',
      inputSchema: setNoteSharedInputType,
      annotations: writeAnnotations({ destructive: false, idempotent: true, openWorld: true }),
    },
    write(setNoteSharedRecord),
  );
  server.registerTool(
    'toggle_note_type',
    {
      description:
        'Convert an owned note to a shopping list or back; converts content and items atomically.',
      inputSchema: toggleNoteTypeInputType,
      annotations: writeAnnotations({ destructive: true, idempotent: false }),
    },
    write(toggleNoteTypeRecord),
  );
  server.registerTool(
    'create_list_item',
    {
      description: 'Add an item to an owned shopping list.',
      inputSchema: createListItemInputType,
      annotations: writeAnnotations({ destructive: false, idempotent: false }),
    },
    write(createListItemRecord),
  );
  server.registerTool(
    'update_list_item',
    {
      description: 'Rename an item in an owned shopping list.',
      inputSchema: updateListItemInputType,
      annotations: writeAnnotations({ destructive: false, idempotent: true }),
    },
    write(updateListItemRecord),
  );
  server.registerTool(
    'set_list_item_checked',
    {
      description: 'Check or uncheck an item in an owned shopping list.',
      inputSchema: setListItemCheckedInputType,
      annotations: writeAnnotations({ destructive: false, idempotent: true }),
    },
    write(setListItemCheckedRecord),
  );
  server.registerTool(
    'delete_list_item',
    {
      description: 'Delete an item from an owned shopping list.',
      inputSchema: deleteListItemInputType,
      annotations: writeAnnotations({ destructive: true, idempotent: false }),
    },
    write(deleteListItemRecord),
  );
}

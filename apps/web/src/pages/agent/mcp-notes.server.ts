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

/** Registers the first write feature; each call checks current consent and operates on owned notes. */
export function registerNoteTools(server: McpServer, userId: string) {
  server.registerTool(
    'create_note',
    {
      description:
        'Create an owned note or shopping list. New notes are private. For shopping lists, add items with create_list_item.',
      inputSchema: createNoteInputType,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (data) => runAgentTool(userId, 'notes', 'write', () => createNoteRecord(userId, data)),
  );

  server.registerTool(
    'update_note',
    {
      description: 'Edit the title or content of an owned note.',
      inputSchema: updateNoteInputType,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (data) => runAgentTool(userId, 'notes', 'write', () => updateNoteRecord(userId, data)),
  );

  server.registerTool(
    'delete_note',
    {
      description: 'Delete an owned note and all its list items.',
      inputSchema: deleteNoteInputType,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (data) => runAgentTool(userId, 'notes', 'write', () => deleteNoteRecord(userId, data)),
  );

  server.registerTool(
    'set_note_shared',
    {
      description: 'Share or unshare an owned note with connected friends.',
      inputSchema: setNoteSharedInputType,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (data) => runAgentTool(userId, 'notes', 'write', () => setNoteSharedRecord(userId, data)),
  );

  server.registerTool(
    'toggle_note_type',
    {
      description:
        'Convert an owned note to a shopping list or back; converts content and items atomically.',
      inputSchema: toggleNoteTypeInputType,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (data) =>
      runAgentTool(userId, 'notes', 'write', () => toggleNoteTypeRecord(userId, data)),
  );

  server.registerTool(
    'create_list_item',
    {
      description: 'Add an item to an owned shopping list.',
      inputSchema: createListItemInputType,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (data) =>
      runAgentTool(userId, 'notes', 'write', () => createListItemRecord(userId, data)),
  );

  server.registerTool(
    'update_list_item',
    {
      description: 'Rename an item in an owned shopping list.',
      inputSchema: updateListItemInputType,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (data) =>
      runAgentTool(userId, 'notes', 'write', () => updateListItemRecord(userId, data)),
  );

  server.registerTool(
    'set_list_item_checked',
    {
      description: 'Check or uncheck an item in an owned shopping list.',
      inputSchema: setListItemCheckedInputType,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (data) =>
      runAgentTool(userId, 'notes', 'write', () => setListItemCheckedRecord(userId, data)),
  );

  server.registerTool(
    'delete_list_item',
    {
      description: 'Delete an item from an owned shopping list.',
      inputSchema: deleteListItemInputType,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (data) =>
      runAgentTool(userId, 'notes', 'write', () => deleteListItemRecord(userId, data)),
  );
}

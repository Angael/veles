import type { McpServer } from '@modelcontextprotocol/server';
import { deleteNoteRecord } from '@/pages/todos/notes.server';
import { deleteNoteInputType, saveNoteInputType } from '@/pages/todos/notes.validation';
import { saveNoteRecord } from '@/pages/todos/saveNote.server';
import { agentInput, agentWriter, writeAnnotations } from './mcp-tools.server';

/** Note and shopping list writes; each call checks current consent and edits own or friend-shared notes; only owned notes can be deleted. */
export function registerNoteTools(server: McpServer, userId: string) {
  const write = agentWriter(userId, 'notes');

  server.registerTool(
    'save_note',
    {
      description:
        'Create (no id; title required) or update (id) an own or friend-shared note or shopping list. Omitted fields stay. New notes are private; shared shows the note to connected friends and only the owner can change it. Changing type converts content lines to list items or back. items adds, edits (name, checked), and removes shopping list items. Returns { id }.',
      inputSchema: agentInput(saveNoteInputType),
      annotations: writeAnnotations({ destructive: true, idempotent: false, openWorld: true }),
    },
    write(saveNoteRecord),
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
}

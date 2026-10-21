import type { McpServer } from '@modelcontextprotocol/server';
import { deleteNoteRecord } from '@/pages/todos/notes.server';
import { deleteNoteInputType, saveNoteInputType } from '@/pages/todos/notes.validation';
import { saveNoteRecord } from '@/pages/todos/saveNote.server';
import { agentInput, agentWriter, writeAnnotations } from './mcp-tools.server';

/** Note and shopping list writes; each call checks current consent and operates on owned notes. */
export function registerNoteTools(server: McpServer, userId: string) {
  const write = agentWriter(userId, 'notes');

  server.registerTool(
    'save_note',
    {
      description:
        'Create (no id; title required) or update (id) an owned note or shopping list. Omitted fields stay. Updates that change title, content, or type need the version from the last read; a stale version fails with a conflict and changes nothing, so read the note again and merge. New notes are private; shared shows the note to connected friends. Changing type converts content lines to list items or back. items adds, edits (name, checked), and removes shopping list items. Returns { id, version }.',
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

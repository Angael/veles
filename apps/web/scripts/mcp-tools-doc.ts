/**
 * Writes docs/agent-tools.md with every MCP tool, its consent, and its inputs. Loads the agent
 * code through Vite with a stub database, so it needs no `.env`, database, or dev server.
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer, type Plugin } from 'vite';

const webRoot = fileURLToPath(new URL('..', import.meta.url));
const output = fileURLToPath(new URL('../../../docs/agent-tools.md', import.meta.url));
const dbStub = 'virtual:db-stub';

// Tool registration never queries; anything importing the database gets an empty object.
const stubDatabase: Plugin = {
  name: 'stub-database',
  enforce: 'pre',
  async resolveId(source, importer, options) {
    if (source === dbStub) return `\0${dbStub}`;
    const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
    return resolved?.id.endsWith('/src/server/db.server.ts') ? `\0${dbStub}` : resolved;
  },
  load: (id) => (id === `\0${dbStub}` ? 'export const db = {};' : undefined),
};

const vite = await createServer({
  root: webRoot,
  configFile: false,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, ws: false },
  resolve: { alias: { '@': `${webRoot}src` } },
  ssr: { noExternal: ['@veles/db'] },
  plugins: [stubDatabase],
});

try {
  const { renderAgentToolsDoc } = (await vite.ssrLoadModule(
    '/src/pages/agent/mcp-tools-doc.server.ts',
  )) as typeof import('../src/pages/agent/mcp-tools-doc.server.ts');
  await writeFile(output, await renderAgentToolsDoc());
  console.log(`Wrote ${output}`);
} finally {
  await vite.close();
}

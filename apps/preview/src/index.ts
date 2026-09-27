import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { serve } from '@hono/node-server';
import { createApp } from './app.ts';
import { loadConfig } from './config.ts';
import { createGithub } from './github.ts';
import { createDokploy } from './dokploy.ts';
import { createStore } from './store.ts';
import { createController } from './controller.ts';

const config = loadConfig();
await mkdir(dirname(config.dbPath), { recursive: true });
const store = createStore(config.dbPath, config.slots);
const github = createGithub(config);
const dokploy = createDokploy({
  url: config.dokployUrl,
  apiKey: config.dokployApiKey,
  repository: config.repository,
  environmentId: config.environmentId,
  slots: config.slots,
});
const controller = createController({ ...config, github, dokploy, store });
let queue = Promise.resolve();
const schedule = () => {
  queue = queue
    .then(() => controller.reconcile())
    .catch((error: unknown) => {
      console.error('Preview reconciliation failed:', error);
    });
};

serve({
  fetch: createApp({
    github,
    repository: config.repository,
    installationId: config.installationId,
    schedule,
  }).fetch,
  port: config.port,
  hostname: '0.0.0.0',
});
setInterval(schedule, 5 * 60 * 1000);
schedule();

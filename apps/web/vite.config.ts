import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig, loadEnv } from 'vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { fileURLToPath } from 'node:url';

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig(({ mode }) => {
  // envDir only adds to import.meta.env, so we need to also add to process.env ourselves
  Object.assign(process.env, loadEnv(mode, workspaceRoot, ''));

  return {
    envDir: workspaceRoot,
    server: {
      port: 3000,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    plugins: [
      tanstackStart({
        srcDirectory: 'src',
      }),
      viteReact(),
      nitro(),
    ],
  };
});

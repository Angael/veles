import { glob, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

// Skipped components are already visible throughout the app or are too large or impractical to
// showcase meaningfully on the components demo page.
const SKIPPED_COMPONENTS = new Set(['app-frame', 'auth-card']);

describe('components demo', () => {
  it('showcases every shared component directory', async () => {
    const root = process.cwd();
    const demoSources: string[] = [];
    const missingComponents: string[] = [];
    for await (const demoFile of glob('src/pages/components-demo/*.tsx', { cwd: root })) {
      demoSources.push(await readFile(resolve(root, demoFile), 'utf8'));
    }

    const demoSource = demoSources.join('\n');

    for await (const componentFile of glob('src/components/*/*.tsx', { cwd: root })) {
      const componentDirectory = componentFile.split('/').at(-2)!;

      if (SKIPPED_COMPONENTS.has(componentDirectory)) {
        continue;
      }

      if (!demoSource.includes(`@/components/${componentDirectory}/`)) {
        missingComponents.push(componentDirectory);
      }
    }

    expect([...new Set(missingComponents)].sort()).toEqual([]);
  });
});

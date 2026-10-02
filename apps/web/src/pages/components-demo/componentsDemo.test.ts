import { glob, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

// Skipped components are already visible throughout the app or are too large or impractical to
// showcase meaningfully on the components demo page.
const SKIPPED_COMPONENTS: Record<string, true> = { 'app-frame': true };

describe('components demo', () => {
  it('showcases every shared component directory', async () => {
    const root = process.cwd();
    const demoSources: string[] = [];
    const missingComponents: string[] = [];
    for await (const demoFile of glob('src/pages/components-demo/*.tsx', { cwd: root })) {
      demoSources.push(await readFile(resolve(root, demoFile), 'utf8'));
    }

    const demoSource = demoSources.join('\n');

    for (const category of ['ui', 'app']) {
      for await (const componentFile of glob(`src/components/${category}/**/*.tsx`, {
        cwd: root,
      })) {
        const pathSegments = componentFile.split('/');
        const componentsIndex = pathSegments.indexOf('components');
        const componentDirectory = pathSegments.at(-2);
        if (componentsIndex < 0 || componentDirectory === undefined) {
          throw new Error(`Expected component glob path to include a directory: ${componentFile}`);
        }

        if (SKIPPED_COMPONENTS[componentDirectory]) {
          continue;
        }

        const importPath = pathSegments.slice(componentsIndex + 1, -1).join('/');
        if (!demoSource.includes(`@/components/${importPath}/`)) {
          missingComponents.push(importPath);
        }
      }
    }

    expect([...new Set(missingComponents)].toSorted()).toEqual([]);
  });
});

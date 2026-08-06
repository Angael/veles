import { glob, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

describe('theme tokens', () => {
  it('only uses defined CSS variables', async () => {
    const root = process.cwd();
    const themePath = resolve(root, 'src/styles/theme.css');
    const themeSource = await readFile(themePath, 'utf8');
    const declaredTokens = new Set(themeSource.match(/--[a-z0-9-]+/g) ?? []);
    const allowedLocalPrefixes = [
      '--btn-',
      '--duration',
      '--easing',
      '--positioner-',
      '--available-',
      '--popup-',
      '--transform-origin',
      '--anchor-width',
      '--card-padding',
      '--toast-',
    ];
    const errors: string[] = [];

    for await (const relativePath of glob('src/**/*.css', { cwd: root })) {
      const filePath = resolve(root, relativePath);
      const source = await readFile(filePath, 'utf8');
      const matches = source.matchAll(/var\((--[a-z0-9-]+)/g);

      for (const match of matches) {
        const token = match[1]!;

        if (
          declaredTokens.has(token) ||
          allowedLocalPrefixes.some((prefix) => token.startsWith(prefix))
        ) {
          continue;
        }

        const line = source.slice(0, match.index).split('\n').length;
        errors.push(
          `${relativePath}:${line} Unknown CSS variable ${token}. Check whether it exists, should be added, or if an existing token should be used instead.`,
        );
      }
    }

    expect(errors).toEqual([]);
  });
});

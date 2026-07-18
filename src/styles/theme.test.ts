import { glob, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

function withoutComments(source: string) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

function getDeclaredTokens(source: string) {
  return new Set(
    Array.from(withoutComments(source).matchAll(/(--[A-Za-z0-9_-]+)\s*:/g), (match) => match[1]!),
  );
}

function getTokenReferences(source: string) {
  return Array.from(withoutComments(source).matchAll(/var\(\s*(--[A-Za-z0-9_-]+)/g));
}

describe('theme tokens', () => {
  it('distinguishes declarations from references and comments', () => {
    const source = `
      /* --comment-only: red; var(--ignored-reference); */
      :root {
        --known: var(--missing);
      }
    `;

    expect(getDeclaredTokens(source)).toEqual(new Set(['--known']));
    expect(getTokenReferences(source).map((match) => match[1])).toEqual(['--missing']);
  });

  it('only uses defined CSS variables', async () => {
    const root = process.cwd();
    const themePath = resolve(root, 'src/styles/theme.css');
    const themeSource = await readFile(themePath, 'utf8');
    const themeTokens = getDeclaredTokens(themeSource);
    const externallyProvidedTokens = new Set([
      '--anchor-width',
      '--available-height',
      '--available-width',
      '--btn-bg-position-hover',
      '--btn-border-width',
      '--popup-height',
      '--popup-width',
      '--positioner-height',
      '--positioner-width',
      '--toast-frontmost-height',
      '--toast-height',
      '--toast-index',
      '--toast-offset-y',
      '--toast-swipe-movement-x',
      '--toast-swipe-movement-y',
      '--transform-origin',
    ]);
    const errors: string[] = [];

    for await (const relativePath of glob('src/**/*.css', { cwd: root })) {
      const filePath = resolve(root, relativePath);
      const source = await readFile(filePath, 'utf8');
      const localTokens = getDeclaredTokens(source);

      for (const match of getTokenReferences(source)) {
        const token = match[1]!;

        if (
          themeTokens.has(token) ||
          localTokens.has(token) ||
          externallyProvidedTokens.has(token)
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

import css from './TanstackDbDemoPage.module.css';

const diffKinds: Partial<Record<string, 'add' | 'remove'>> = { '+ ': 'add', '- ': 'remove' };

/** Read-only code block. Lines that start with `+ ` or `- ` render as added or removed lines. */
export function CodeSnippet({ code, title }: { code: string; title: string }) {
  const lines = code.trim().split('\n');

  return (
    <figure className={css.snippet}>
      <figcaption>{title}</figcaption>
      <pre>
        <code>
          {lines.map((line, index) => {
            const kind = diffKinds[line.slice(0, 2)];
            const isComment = line.trimStart().startsWith('//');
            return (
              <span
                className={css.codeLine}
                data-comment={isComment || undefined}
                data-diff={kind}
                // Lines are static text and never reorder, so the index is a stable key.
                key={index}
              >
                {line || ' '}
                {'\n'}
              </span>
            );
          })}
        </code>
      </pre>
    </figure>
  );
}

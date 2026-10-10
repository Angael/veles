import { CheckIcon, CopyIcon } from 'lucide-react';
import { useState } from 'react';
import css from './AgentSetupGuide.module.css';

interface AgentSetupGuideProps {
  apiKey: string;
  userName: string;
}

/** Builds a per-person server name so agents shared by several people keep keys apart. */
function serverName(userName: string) {
  const slug = userName
    .split(/\s+/)[0]
    ?.normalize('NFKD')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
  return slug ? `veles-${slug}` : 'veles';
}

/** Shows one copy-on-press prompt the user sends to their AI agent, plus manual configs. */
export function AgentSetupGuide({ apiKey, userName }: AgentSetupGuideProps) {
  const url = new URL('/api/mcp', window.location.origin).href;
  const name = serverName(userName);
  const prompt = `Please connect to my Veles account. Add an HTTP MCP server named "${name}" with URL ${url} and header "Authorization: Bearer ${apiKey}". This key belongs to ${userName}; use it only for ${userName}'s requests. Then restart or reload your MCP tools and call get_access to confirm.`;
  const configs = [
    {
      label: 'Hermes (~/.hermes/config.yaml)',
      code: `mcp_servers:\n  ${name}:\n    url: "${url}"\n    headers:\n      Authorization: "Bearer ${apiKey}"`,
    },
    {
      label: 'Claude Code (terminal)',
      code: `claude mcp add --transport http --scope user ${name} ${url} --header "Authorization: Bearer ${apiKey}"`,
    },
    {
      label: 'Codex (~/.codex/config.toml)',
      code: `[mcp_servers.${name}]\nurl = "${url}"\nhttp_headers = { Authorization = "Bearer ${apiKey}" }`,
    },
  ];

  return (
    <div className={css.guide}>
      <p>
        <strong>Key created. It is shown only once.</strong> Send this prompt to your AI agent, or
        to the person who runs it.
      </p>
      <CopyBlock code={prompt} label='Prompt for your AI agent' />
      <details>
        <summary>Manual setup</summary>
        {configs.map((config) => (
          <CopyBlock code={config.code} key={config.label} label={config.label} />
        ))}
      </details>
    </div>
  );
}

/** Copies on pointer down so one tap or click is enough, including on touch screens. */
function CopyBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => void navigator.clipboard.writeText(code).then(() => setCopied(true));
  return (
    <button
      className={css.copyBlock}
      data-copied={copied || undefined}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') copy();
      }}
      onPointerDown={copy}
      type='button'
    >
      <span className={css.copyLabel}>
        <span>{label}</span>
        <span>
          {copied ? <CheckIcon aria-hidden='true' /> : <CopyIcon aria-hidden='true' />}
          {copied ? 'Copied' : 'Tap to copy'}
        </span>
      </span>
      <pre>{code}</pre>
    </button>
  );
}

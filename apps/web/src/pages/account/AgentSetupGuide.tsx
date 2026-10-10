import { CopyIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Label } from '@/components/ui/label/Label';
import { TextInput } from '@/components/ui/text-input/TextInput';
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

/** Shows ready-to-paste MCP configs for common agents right after a key is created. */
export function AgentSetupGuide({ apiKey, userName }: AgentSetupGuideProps) {
  const url = new URL('/api/mcp', window.location.origin).href;
  const name = serverName(userName);
  const snippets = [
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
      <Label text='Copy this key now, it is shown only once'>
        <TextInput onFocus={(event) => event.target.select()} readOnly value={apiKey} />
      </Label>
      <p>
        Add Veles to your agent with one of the configs below, then restart the agent. If the agent
        already has a Veles connection for another person, keep it and add this one beside it.
      </p>
      {snippets.map((snippet) => (
        <Snippet code={snippet.code} key={snippet.label} label={snippet.label} />
      ))}
      <p>
        Other agents: use HTTP MCP endpoint {url} with header Authorization: Bearer &lt;key&gt;.
      </p>
    </div>
  );
}

function Snippet({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <section className={css.snippet}>
      <header>
        <h3>{label}</h3>
        <Btn
          icon={<CopyIcon aria-hidden='true' />}
          onClick={() => {
            void navigator.clipboard.writeText(code).then(() => setCopied(true));
          }}
          size='sm'
          variant='ghost'
        >
          {copied ? 'Copied' : 'Copy'}
        </Btn>
      </header>
      <pre>{code}</pre>
    </section>
  );
}

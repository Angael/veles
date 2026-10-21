import { CheckIcon, CopyIcon, SparklesIcon } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';
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
  const { t } = useI18n();
  const url = new URL('/api/mcp', window.location.origin).href;
  const name = serverName(userName);
  const prompt = t({
    en: [
      `Please connect to my Veles account. Add an HTTP MCP server named "${name}" with URL ${url} and header "Authorization: Bearer ${apiKey}".`,
      `Other "veles-*" servers can already exist: each one is a different person's account, so keep them. If "${name}" already exists, replace only its key.`,
      `Remember that I, the sender of this message, am ${userName} and my Veles server is "${name}".`,
      `Use "${name}" for my requests and for questions about ${userName}. Save changes to the sender's own server, unless they clearly name another person.`,
      'Then reload your MCP tools and call get_access to confirm.',
      'Keep this key only in the MCP config: do not save it to memory or notes, and redact it from logs and history that you control.',
      'Finally, remind me to delete this message or thread from the chat.',
    ],
    pl: [
      `Połącz się z moim kontem Veles. Dodaj serwer MCP HTTP o nazwie "${name}" z adresem URL ${url} i nagłówkiem "Authorization: Bearer ${apiKey}".`,
      `Inne serwery "veles-*" mogą już istnieć: każdy z nich to konto innej osoby, więc ich nie usuwaj. Jeśli "${name}" już istnieje, zmień tylko jego klucz.`,
      `Zapamiętaj, że ja, nadawca tej wiadomości, to ${userName}, a mój serwer Veles to "${name}".`,
      `Do moich próśb i pytań, które dotyczą osoby ${userName}, używaj "${name}". Zapisuj zmiany na własnym serwerze nadawcy, chyba że wyraźnie wskaże inną osobę.`,
      'Potem przeładuj narzędzia MCP i wywołaj get_access, aby to potwierdzić.',
      'Trzymaj ten klucz tylko w konfiguracji MCP: nie zapisuj go w pamięci ani notatkach i usuwaj go z logów i historii, nad którymi masz kontrolę.',
      'Na koniec przypomnij mi o usunięciu tej wiadomości lub wątku z czatu.',
    ],
  }).join(' ');
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
      <section className={css.promptBox}>
        <h3>
          <SparklesIcon aria-hidden='true' />
          {t({ en: 'Prompt for your AI agent', pl: 'Prompt dla Twojego agenta AI' })}
        </h3>
        <p>
          {t({
            en: 'It is shown only once. Send this prompt to your AI agent.',
            pl: 'Zobaczysz go tylko raz. Wyślij ten prompt do swojego agenta AI.',
          })}
        </p>
        <CopyBlock code={prompt} label={t({ en: 'Prompt', pl: 'Prompt' })} />
        <p>
          {t({
            en: 'After the agent confirms, delete the message or thread that contains the key. This reduces exposure, but your AI provider can keep copies. Manual setup keeps the key out of chat.',
            pl: 'Gdy agent potwierdzi połączenie, usuń wiadomość lub wątek z kluczem. To ogranicza ryzyko, ale dostawca AI może zachować kopie. Ręczna konfiguracja nie przekazuje klucza przez czat.',
          })}
        </p>
      </section>
      <details>
        <summary>{t({ en: 'Manual setup', pl: 'Ręczna konfiguracja' })}</summary>
        {configs.map((config) => (
          <CopyBlock code={config.code} key={config.label} label={config.label} />
        ))}
      </details>
    </div>
  );
}

/** Copies on pointer down so one tap or click is enough, including on touch screens. */
function CopyBlock({ code, label }: { code: string; label: string }) {
  const { t } = useI18n();
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
          {copied
            ? t({ en: 'Copied', pl: 'Skopiowano' })
            : t({ en: 'Tap to copy', pl: 'Dotknij, aby skopiować' })}
        </span>
      </span>
      <pre>{code}</pre>
    </button>
  );
}

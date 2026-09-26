import { type } from 'arktype';

const configType = type({
  GITHUB_REPOSITORY: 'string >= 3',
  GITHUB_MAIN_BRANCH_NAME: 'string >= 1',
  GITHUB_APP_ID: 'string.digits',
  GITHUB_INSTALLATION_ID: 'string.digits',
  GITHUB_APP_PRIVATE_KEY: 'string >= 1',
  GITHUB_WEBHOOK_SECRET: 'string >= 1',
  DOKPLOY_URL: 'string.url',
  DOKPLOY_API_KEY: 'string >= 1',
  PREVIEW_ENVIRONMENT_ID: 'string >= 1',
  PREVIEW_SLOTS: 'string.json.parse',
  'PREVIEW_DB_PATH?': 'string >= 1',
  'PORT?': 'string.numeric.parse |> 1 <= number.integer <= 65535',
});
const slotType = type({
  '+': 'reject',
  composeId: 'string >= 1',
  url: 'string.url',
});
const slotsType = slotType.array().atLeastLength(1).atMostLength(3);

/** Validate runtime credentials and slot mapping before any Dokploy mutation. */
export function loadConfig() {
  const raw = configType(process.env);
  if (raw instanceof type.errors) throw new Error(`Invalid preview config: ${raw.summary}`);
  if (!/^[\w.-]+\/[\w.-]+$/.test(raw.GITHUB_REPOSITORY))
    throw new Error('GITHUB_REPOSITORY must be owner/name');
  const slots = slotsType(raw.PREVIEW_SLOTS);
  if (slots instanceof type.errors) throw new Error(`Invalid PREVIEW_SLOTS: ${slots.summary}`);
  const dokployUrl = new URL(raw.DOKPLOY_URL);
  if (dokployUrl.protocol !== 'https:') throw new Error('DOKPLOY_URL must use HTTPS');
  const ids = new Set<string>();
  const urls = new Set<string>();
  for (const [index, slot] of slots.entries()) {
    const url = new URL(slot.url);
    if (url.protocol !== 'https:' || url.origin !== slot.url)
      throw new Error(`Slot ${index + 1} needs an HTTPS origin`);
    if (ids.has(slot.composeId) || urls.has(slot.url))
      throw new Error('Duplicate preview Compose ID or URL');
    ids.add(slot.composeId);
    urls.add(slot.url);
  }
  return {
    repository: raw.GITHUB_REPOSITORY,
    mainBranchName: raw.GITHUB_MAIN_BRANCH_NAME,
    appId: raw.GITHUB_APP_ID,
    installationId: raw.GITHUB_INSTALLATION_ID,
    privateKey: raw.GITHUB_APP_PRIVATE_KEY.replaceAll('\\n', '\n'),
    webhookSecret: raw.GITHUB_WEBHOOK_SECRET,
    dokployUrl: dokployUrl.origin,
    dokployApiKey: raw.DOKPLOY_API_KEY,
    environmentId: raw.PREVIEW_ENVIRONMENT_ID,
    slots: slots.map((slot, index) => ({ ...slot, number: index + 1 })),
    dbPath: raw.PREVIEW_DB_PATH || '/data/preview.sqlite',
    port: raw.PORT || 3000,
  };
}

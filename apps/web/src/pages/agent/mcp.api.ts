import {
  bearerAuthChallengeResponse,
  createMcpHandler,
  OAuthError,
  OAuthErrorCode,
  verifyBearerToken,
} from '@modelcontextprotocol/server';
import { type } from 'arktype';
import { auth } from '@/server/auth.server';
import { log } from '@/server/logger.server';
import { createAgentServer } from './mcp-server.server';

const mcpHandler = createMcpHandler(
  ({ authInfo }) => {
    const userId = authInfo?.extra?.userId;
    if (typeof userId !== 'string' || !userId) {
      throw new OAuthError(OAuthErrorCode.InvalidToken, 'Missing API key owner');
    }
    return createAgentServer(userId);
  },
  {
    maxRequestBodySize: 131_072,
    onerror: (error) => log.error('MCP request failed', { error: error.message }),
  },
);

/** A valid key over its quota; answered with 429 instead of an auth challenge. */
class ApiKeyRateLimited extends Error {
  constructor(readonly retryAfterMs: number) {
    super('API key rate limit exceeded');
  }
}

const rateLimitDetails = type({ details: { tryAgainIn: 'number' } });

const apiKeyVerifier = {
  /** Maps a Better Auth API key to MCP auth info; revoked/expired keys and rate limits fail here. */
  async verifyAccessToken(token: string) {
    const { valid, key, error } = await auth.api.verifyApiKey({ body: { key: token } });
    if (error?.code === 'RATE_LIMITED') {
      // `details` is sent at runtime but missing from the plugin's response type.
      const retry = rateLimitDetails(error);
      throw new ApiKeyRateLimited(retry instanceof type.errors ? 60_000 : retry.details.tryAgainIn);
    }
    if (!valid || !key) {
      throw new OAuthError(OAuthErrorCode.InvalidToken, 'Invalid or expired API key');
    }
    return {
      token,
      clientId: key.id,
      // Consent is checked per feature, not granted by possession of a key.
      scopes: [],
      // The SDK requires a numeric expiry; keys without one never expire.
      expiresAt: key.expiresAt
        ? Math.floor(new Date(key.expiresAt).getTime() / 1000)
        : Number.POSITIVE_INFINITY,
      extra: { userId: key.referenceId },
    };
  },
};

/** Verifies the bearer key; returns an error response for bad keys (401) and exhausted quotas (429). */
async function authenticate(request: Request) {
  const [header] = (request.headers.get('authorization') ?? '').split(',');
  try {
    return await verifyBearerToken(header || undefined, { verifier: apiKeyVerifier });
  } catch (error) {
    if (!(error instanceof ApiKeyRateLimited)) return bearerAuthChallengeResponse(error);
    const retryAfter = Math.ceil(error.retryAfterMs / 1000);
    return Response.json(
      { error: 'rate_limited', error_description: `Too many requests. Retry in ${retryAfter}s.` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }
}

/** Authenticates the agent's API key, then serves one stateless MCP request with feature consent. */
export async function handleMcpRequest(request: Request) {
  const authInfo = await authenticate(request);
  if (authInfo instanceof Response) return authInfo;
  log.info('MCP request', { apiKeyId: authInfo.clientId });
  return mcpHandler.fetch(request, { authInfo });
}

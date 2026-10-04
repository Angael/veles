# Agent access (MCP)

Veles exposes a read-only [MCP](https://modelcontextprotocol.io) server at `/api/mcp` so an agent (e.g. Hermes on a VPS) can read the signed-in user's data without database access.

- Transport: stateless Streamable HTTP via `@modelcontextprotocol/server` (`createMcpHandler`); 2025 and 2026 protocol clients both work.
- Auth: Better Auth API keys (`@better-auth/api-key`). Keys are hashed at rest, expire after 90 days, are rate-limited to 120 requests/minute, and are checked on every request. Revoking a key cuts the agent off right away.
- Code: `apps/web/src/pages/agent/mcp.api.ts`.

## Setup

1. In Veles, open **Account → Agent access**, create a key, and copy it. It is shown only once.
2. Configure the agent's MCP client:

```yaml
mcp_servers:
  veles:
    url: https://<veles-host>/api/mcp
    headers:
      Authorization: Bearer vls_...
```

Smoke test from the VPS:

```sh
curl -s https://<veles-host>/api/mcp \
  -H "Authorization: Bearer $VELES_KEY" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Tools

| Tool           | Input                                  | Returns                                       |
| -------------- | -------------------------------------- | --------------------------------------------- |
| `list_records` | `resource`, `cursor?`, `limit?` (≤100) | `{ items, nextCursor }`; repeat until `null`  |
| `get_record`   | `resource`, `id`                       | the record, or `null` if missing or not yours |

Resources: `diary_entries`, `notes`, `list_items`, `weights`, `recipes`, `food_logs`, `calorie_goals`, `food_products` (shared catalog). The `list_records` tool description gives the units. Records are whole table rows without the owner column, so new columns show up automatically.

## Adding a resource

Add an entry to `resources` in `mcp.api.ts` with its table, id column, a one-line description (include units), and an ownership `scope`.

## Writes

Writes are not supported yet. To add them later, use a separate key permission (the API-key plugin supports `permissions`) and call the same validators and operations the app uses.

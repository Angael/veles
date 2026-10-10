# Agent access (MCP)

Veles exposes a permission-controlled [MCP](https://modelcontextprotocol.io) server at `/api/mcp` so an agent (e.g. Hermes on a VPS) can read and change allowed parts of the key owner's data without database access.

- Transport: stateless Streamable HTTP via `@modelcontextprotocol/server` (`createMcpHandler`); 2025 and 2026 protocol clients both work.
- Auth: Better Auth API keys (`@better-auth/api-key`). Keys are hashed at rest, do not expire, are rate-limited to 120 requests/minute, and are checked on every request. Revoking a key cuts the agent off right away.
- Code: `apps/web/src/pages/agent/mcp.api.ts`.

## Setup

1. In Veles, open **Account → Agent access** and choose which features AI may read or write. Every switch starts off, including for existing keys.
2. Create a key and copy it. It is shown only once.
3. Configure the agent's MCP client:

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
| `get_access`   | none                                   | current consent and write rollout status      |
| `list_records` | `resource`, `cursor?`, `limit?` (≤100) | `{ items, nextCursor }`; repeat until `null`  |
| `get_record`   | `resource`, `id`                       | the record, or `null` if missing or not yours |

Read resources: `diary_entries`, `notes`, `list_items`, `weights`, `recipes`, `food_logs`, `calorie_goals`, `food_products` (shared catalog). Read tools appear only when at least one feature permits reads. The `list_records` tool description lists permitted resources and their units. Each call also checks current consent. Records are whole table rows without the owner column, so new columns show up automatically.

## Consent and writes

Read and write consent are independent, apply to all keys owned by the account, and are checked at each tool call. Write-only access returns mutation acknowledgements or new IDs, not record contents. Turning off a switch cuts off that operation for existing keys. Refresh `tools/list` after a change to discover the available tools.

The first write feature is **Notes and shopping lists**. With its Write switch on, agents can use:

- `create_note`: `title`, `content`, `type` (`note` or `shopping_list`). New notes are private. Use empty content for shopping lists, then add list items.
- `update_note`: `id`, optional `title` and `content`.
- `delete_note`: `id`; also deletes its list items.
- `set_note_shared`: `id`, `shared`; shares or unshares an owned note with connected friends.
- `toggle_note_type`: `id`; converts note content to list items or list items back to text.
- `create_list_item`: `noteId`, `name`.
- `update_list_item`: `id`, `name`.
- `set_list_item_checked`: `id`, `checked`.
- `delete_list_item`: `id`.

Creates return `{ id }`; other writes return `{ success: true }`. Permission denials and operation failures are MCP tool errors (`isError: true`). Inputs use the same validators and server operations as the app. MCP can change only owned notes and their items; it cannot change a friend's shared note. Ownership, IDs, and timestamps are set by the server. Keys cannot act as browser sessions or change account consent.

Other Write switches show **Coming soon** and remain disabled. The rollout can add diary and weight writes next, then recipes, food diary and nutrition goals, and the shared catalog. Each feature must reuse its app operations, including photo handling and nutrition snapshot updates. Future writes do not inherit consent: their switches remain off until the user enables them.

## Adding a feature

1. Define its label and rollout status in `apps/web/src/lib/agentAccess.ts`.
2. Add read resources in `mcp-resources.server.ts`, with a feature, table, ID column, units, and ownership scope.
3. Reuse the feature's validators and server operations for writes. Run every data tool through `runAgentTool` and keep MCP writes scoped to the key owner.
4. Set `writeAvailable` only when those write tools are implemented and registered. Keep all permissions off by default.

## Database rollout

Before merging, a human must run `pnpm db:generate -- --name=agent_access`, review and commit the generated migration for both `apikey` and `user_agent_permission`, and apply it to dev and prod. Do this before merging to `main`, which deploys the app. This PR does not run Drizzle commands or verify against a migrated database.

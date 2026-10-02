# Veles access for Hermes and other agents

Veles exposes a read-only MCP server at `https://YOUR_VELES_HOST/api/agent/mcp`.
The endpoint uses Streamable HTTP with JSON responses and no persistent MCP
sessions. It runs inside the existing Veles web deployment; Hermes needs no
database access, additional Veles service, or local bridge.

## Why MCP

| Approach                                | Fit for this app                                                                                                                                |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP MCP inside Veles (chosen)          | Hermes discovers tools and argument schemas automatically. Uses the app's database connection and deployment.                                   |
| Authenticated REST API                  | Good for scripts, but Hermes also needs tool wrappers or instructions explaining requests. Maintaining a second surface adds work here.         |
| Separate service or VPS-side MCP bridge | Adds a deployment, dependencies, and a second place to maintain authorization. A bridge is unnecessary because Hermes supports remote HTTP MCP. |

[Hermes's MCP guide](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp/)
documents remote URLs, authorization headers, environment substitution, and
automatic discovery. The server uses the official
[TypeScript MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk),
pinned to `1.32.0`, rather than implementing JSON-RPC itself.

## Deployment prerequisite

This draft adds the `agent_credential` schema. Its generated migration is pending:
repository rules require the human to run Drizzle commands. Before deployment:

1. Run `pnpm db:generate -- --name=agent_credentials` from the repository root.
2. Review and commit the generated SQL and snapshot with this change. The only
   intended schema addition is `agent_credential`, with its user foreign key,
   unique token digest, user index, and read-only scope check.
3. Run `pnpm db:reset` against the disposable development database to verify
   migration history from scratch. This resets development data.
4. Verify token creation/revocation and the requests below against that database.
5. Run `pnpm db:migrate:prod` **before** merging/pushing to `main`, which deploys
   the web app automatically.

Do not deploy the Account card or MCP endpoint before the table exists. No new
Veles environment variables are required; the endpoint uses the existing
`APP_URL` and database/storage configuration.

## Create and revoke credentials

1. Sign in to Veles as the user whose data Hermes should read.
2. Open **Account → Agent access**, name the token (for example `Hermes VPS`),
   and select **Create read-only token**.
3. Copy the token immediately. It is shown once, is valid for 90 days, and is
   stored by Veles only as a SHA-256 digest of a random 256-bit secret.
4. Copy the MCP endpoint shown in the same card.

The server requires `Authorization: Bearer vls_ro_...` on every request. Browser
cookies, user IDs, Google access tokens, and Veles database credentials are not
agent authentication methods. The token cannot authorize browser server functions.

Use **Revoke** next to a token to delete it. Every new HTTP request checks the
database, so expired/deleted credentials fail even when Hermes already connected.
A read already executing may finish. To rotate, create a replacement, update
Hermes, and revoke the old token. Deleting a user cascades to their credentials.

## Configure Hermes on the VPS

Save `VELES_AGENT_TOKEN=vls_ro_YOUR_TOKEN` in `~/.hermes/.env`, then add this to
`~/.hermes/config.yaml` (merge with existing configuration):

```yaml
mcp_servers:
  veles:
    url: 'https://YOUR_VELES_HOST/api/agent/mcp'
    headers:
      Authorization: 'Bearer ${VELES_AGENT_TOKEN}'
    tools:
      include:
        - veles_list_resources
        - veles_list_records
        - veles_get_record
```

Restrict access to the credentials file with `chmod 600 ~/.hermes/.env`. Restart
the Hermes process or gateway after changing the environment; for an existing
chat session, `/reload-mcp` refreshes MCP discovery. No OAuth browser callback or
SSH tunnel is needed. Use your existing HTTPS Veles address.

Try: “Discover my Veles collections, then read my diary and weight history. Fetch
every page before summarizing.” Hermes registers names with a server prefix,
such as `mcp_veles_veles_list_records`; tool descriptions supply the arguments.

## Available tools

| Tool                   | Arguments                                                           | Result                                                                        |
| ---------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `veles_list_resources` | `{}`                                                                | Version, `access: "read"`, and collections with descriptions and field names. |
| `veles_list_records`   | `resource`, optional `limit` (1–100; default 50), optional `cursor` | `{items, nextCursor}` with full record content.                               |
| `veles_get_record`     | `resource`, `id`                                                    | `{record}`; `null` for missing or unauthorized records.                       |

All tools are annotated read-only. Unknown tools, resources, extra arguments,
and malformed pagination inputs are rejected. Returned text/Markdown is user
content, not instructions for an agent to execute.

Read until `nextCursor` is `null`, passing each returned value unchanged as
`cursor`. Results are ordered by the record's textual ID, not by entry date;
sort locally for chronological analysis. IDs are scoped to their collection.
This is live keyset pagination, not a transaction snapshot: concurrent changes
can affect an export. Date-only fields are `YYYY-MM-DD`; timestamps are ISO strings.

## Resource coverage and units

| Collection               | Content and ownership                                                                                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `profile`                | The token owner's profile; ID is the user ID.                                                                                                                                                                            |
| `diary_entries`          | Owned titles, dates, full Markdown, and timestamps.                                                                                                                                                                      |
| `notes`                  | Owned text notes and shopping lists, including sharing state.                                                                                                                                                            |
| `list_items`             | Items under owned notes; join on `noteId`.                                                                                                                                                                               |
| `weights`                | Owned dates and `weightGrams`; divide by 1,000 for kilograms.                                                                                                                                                            |
| `recipes`                | Owned ingredients, description, tags, rating, portions, and nutrition. Nutrition totals cover the stored `portions`; divide by portions for a serving. Energy is `kcal`; macros are `protein`, `fats`, `carbs` in grams. |
| `recipe_images`          | Image references under owned recipes; join on `recipeId`, then resolve `uploadObjectId` through `uploads`.                                                                                                               |
| `recipe_last_views`      | Owner's legacy history; ID is `recipeId`. The app no longer updates it.                                                                                                                                                  |
| `uploads`                | Owned storage metadata and public CDN URL. Private uploads have no URL; private downloads are not implemented by the app.                                                                                                |
| `food_logs`              | Owned food diary snapshots; divide all `*Hundredths` by 100. Energy is kcal; macros are protein, fat, carbs in grams.                                                                                                    |
| `calorie_goals`          | Owned goal history by `effectiveDate`; divide `*Hundredths` by 100.                                                                                                                                                      |
| `food_products`          | Shared public catalog, the only global collection. Nutrition is per 100 g; divide `*Hundredths` by 100.                                                                                                                  |
| `sharing_settings`       | Owner's preferences; ID is the user ID. An absent record means all sharing is disabled.                                                                                                                                  |
| `connections`            | Relationships involving the owner; ID is the other user's ID. No other user's private content is exposed.                                                                                                                |
| `connection_invitations` | Sent/received invitation metadata; received invitations are matched against the owner's database email. No token digests.                                                                                                |
| `food_log_shares`        | Pending shares sent/received by the owner.                                                                                                                                                                               |
| `food_log_share_items`   | Items under those shares; another user's `foodLogId` is a reference and does not permit fetching their log.                                                                                                              |

Nullable nutrition values mean unknown, not zero. Shared catalog image references
may point to uploads outside the owner's upload collection; they grant no access
to another user's upload metadata. This first version exports owned content and
relationship metadata, not friends' shared notes, weight history, or recipe libraries.
Authentication accounts, passwords, OAuth tokens, sessions, verifications,
invitation digests, and agent credentials are never discoverable collections.

## Example read requests

For a manual check on the VPS, set `VELES_MCP_URL` to the Account card's endpoint
and load `VELES_AGENT_TOKEN` from your private environment. These examples avoid
putting the bearer secret directly in curl's process arguments:

```bash
export VELES_MCP_URL='https://YOUR_VELES_HOST/api/agent/mcp'

veles_request() {
  printf 'Authorization: Bearer %s\n' "$VELES_AGENT_TOKEN" |
    curl --silent --show-error --fail-with-body \
      --header @- \
      --header 'Content-Type: application/json' \
      --header 'Accept: application/json, text/event-stream' \
      --header 'MCP-Protocol-Version: 2025-03-26' \
      --data "$1" "$VELES_MCP_URL"
}

# Initialize (Hermes performs this handshake automatically).
veles_request '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"vps-check","version":"1.0.0"}}}'
veles_request '{"jsonrpc":"2.0","method":"notifications/initialized"}'

# Discover tools and collections.
veles_request '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
veles_request '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"veles_list_resources","arguments":{}}}'

# Read a page. JSON results are in result.content[0].text.
veles_request '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"veles_list_records","arguments":{"resource":"diary_entries","limit":20}}}'

# Continue using the returned nextCursor; stop when it is null.
veles_request '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"veles_list_records","arguments":{"resource":"diary_entries","limit":20,"cursor":"RETURNED_NEXT_CURSOR"}}}'

# Get a complete record using an ID returned by the list.
veles_request '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"veles_get_record","arguments":{"resource":"diary_entries","id":"RETURNED_RECORD_ID"}}}'
```

Missing, revoked, or expired tokens return HTTP 401. Wrong browser origins return 403. The stateless endpoint accepts POST only; authenticated GET/DELETE return
405, which Streamable HTTP clients can handle without an SSE connection. All
responses are `Cache-Control: no-store`. The body limit is 16 KiB, and each token
has a 120-request/minute limit per web process (429 with `Retry-After: 60`).
Multiple replicas have independent rate counters. Logs record credential ID,
owner, tool, and collection, not tokens, record IDs, or content.

## Suggested write scope — requires confirmation, not enabled

This draft has no content mutation tools and no write credentials. Both token
lookup and a database constraint restrict scopes to `read`. MCP POST is protocol
transport, not write permission. Confirm the authorization model and individual
mutations before changing this restriction.

The suggested next step is a distinct, revocable `write` credential, issued only
after the user chooses it in Account settings. Read-only tokens must never be
upgraded in place. Start with owned notes/list items, diary entries, weight
upserts, calorie goals, food logs, and recipe text/nutrition. Keep global food
product edits, invitations/sharing, account/auth changes, and uploads outside
the initial write scope. Global product edits currently refresh other users'
logs, so they do not fit user-isolated agent writes.

Before adding a mutation, extract its existing ArkType validator and business
operation into a feature-owned server module. Browser and agent adapters should
call the same operation with a server-derived user ID. Recheck ownership within
the write query/transaction; do not reuse a preceding read as authorization or
fabricate a browser session. Shared-note collaboration in the browser must not
silently broaden an agent's own-data write scope. Destructive tools should have
explicit names and MCP annotations, and writes should support retry-safe behavior.
Write request examples should be added only when those mutations are enabled.

## Adding future features

The registry is intentionally explicit: future database tables are not exposed
automatically. For each new user-owned feature:

1. Add a collection to the appropriate `apps/web/src/pages/agent/*-resources.server.ts`
   file using `defineAgentResource`, an explicit field projection, stable key,
   and a required ownership predicate.
2. For child tables, scope through an owned parent, as `list_items` and
   `recipe_images` do. Review both listing and detail access; the helper applies
   the same predicate to both.
3. Describe units, null semantics, and join keys. Update the coverage table here.
4. Keep incompatible contracts behind a future versioned endpoint. The current
   schema/collection list and MCP argument enum update automatically from the registry.

The registry does not enumerate arbitrary SQL tables or accept a caller-supplied
user ID. This preserves discovery for agents while making each extension's
authorization and public fields reviewable.

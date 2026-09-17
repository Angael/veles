# Authentication and invitation flow

This document describes the current Veles authentication and connection-invitation flow, the client-driven flow it replaced, and which parts follow Better Auth or TanStack guidance versus application-specific policy.

## Scope and versions

Veles currently uses:

- Better Auth `1.6.28`
- TanStack Start `1.168.44`
- TanStack Router `1.170.27`
- Google as the only social provider

The versioned Better Auth 1.6 documentation is used below because it matches the installed Better Auth release. TanStack documentation links use the current Start and Router guides.

## Decision summary

Authentication is owned by Better Auth. Veles adds two small TanStack server routes in front of it:

- `/auth/google` starts Google OAuth on the server and returns a real HTTP redirect.
- `/invite/$token` turns an invitation link into a redirect through `/auth/google`.

This avoids waiting for the React application to hydrate before OAuth can begin. Invitation acceptance remains a separate Veles operation after authentication rather than being embedded in a Better Auth callback hook.

## Previous flow

The previous invitation email linked to:

```text
/login?redirect=/?invitation=<token>
```

`/login` had `ssr: false`. Its React component called the Better Auth client API, `signIn.social(...)`, after the page hydrated. Depending on the revision, that call was started by the Google button or by a mount effect.

The effective flow was:

```text
Email
  -> client-only /login route
  -> application document downloads
  -> React hydrates
  -> client calls signIn.social(...)
  -> Google
  -> Better Auth callback
  -> /?invitation=<token>
  -> Veles accepts the invitation
  -> /
```

The browser was not deliberately sent to `/` before login. The confusing intermediate state came from the client-only login route: the generic application document had to load and hydrate before the login component could start OAuth.

### What was valid in the previous flow

The previous flow used Better Auth's recommended client SDK and supplied a `callbackURL`. This is the default and well-supported Better Auth pattern. Better Auth still owned OAuth state, PKCE, the provider callback, account creation, and session issuance.

### What was lacking

The OAuth redirect depended on React execution even though starting OAuth is fundamentally an HTTP navigation. That caused avoidable delay and an intermediate application render for the highest-intent path in the app: clicking an invitation email.

Making the client call automatically from a React effect reduced one click but did not remove the dependency on JavaScript download, route resolution, and hydration. It also made a render side effect responsible for navigation.

## Current flow

### Invitation recipient

Invitation emails now link to:

```text
/invite/<token>
```

The request follows this sequence:

```text
Email
  -> GET /invite/<token>
  -> 302 /auth/google?redirect=/?invitation=<token>
  -> 302 Google authorization URL
  -> GET /api/auth/callback/google
  -> 302 /?invitation=<token>
  -> authenticated invitation acceptance
  -> 302 /
```

No React component or client-side JavaScript is required before reaching Google.

Relevant files:

- `apps/web/src/pages/account/connections.server.ts` creates the email URL.
- `apps/web/src/routes/invite.$token.ts` validates the token shape and redirects to the OAuth entry.
- `apps/web/src/routes/auth.google.ts` starts OAuth.
- `apps/web/src/routes/api/auth/$.ts` mounts the Better Auth handler, including `/api/auth/callback/google`.
- `apps/web/src/routes/index.tsx` accepts the invitation after authentication.
- `apps/web/src/pages/account/connections.api.ts` enforces the authenticated acceptance rules.

### Normal login

`/login` is server-rendered. Its “Continue with Google” control is a normal anchor to:

```text
/auth/google?redirect=<safe-local-path>
```

The link works before hydration. If the request already has a valid session, `/auth/google` redirects directly to the requested local destination instead of starting another Google flow.

### Signup and sign-in are one Google flow

Veles does not present separate Google “sign up” and “sign in” operations. Better Auth signs in an existing Google-linked user or creates a user when allowed.

Before Better Auth creates a user, the custom database hook in `apps/web/src/server/auth.server.ts` requires either:

- an invitation whose recipient email matches the Google email, or
- an email in the configured administrator allowlist.

This invitation check authorizes account creation. It does not create the connection. The connection is created only when the authenticated recipient presents the invitation token or accepts a pending invitation from the account UI.

## Responsibility boundaries

| Responsibility                                                                                          | Owner                            | Classification                       |
| ------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------ |
| Google authorization URL, OAuth state, PKCE, callback validation, account linking, and session issuance | Better Auth                      | By the book                          |
| Mounting Better Auth at `/api/auth/$` with GET and POST handlers                                        | TanStack server route            | By the book                          |
| Propagating Better Auth cookies through `tanstackStartCookies()`                                        | Better Auth TanStack integration | By the book                          |
| Reading a session with `auth.api.getSession({ headers })`                                               | Better Auth server API           | By the book                          |
| Starting OAuth with `auth.api.signInSocial({ body, headers })`                                          | Better Auth server API           | Supported, with custom navigation    |
| Returning a browser-level `302` from `/auth/google`                                                     | Veles                            | Intentional custom adapter           |
| Sanitizing the post-authentication redirect to a local path                                             | Veles                            | Required application security policy |
| Requiring an invitation before user creation                                                            | Veles Better Auth database hook  | Custom product policy                |
| Matching the invitation recipient email to the authenticated email                                      | Veles server function            | Custom authorization rule            |
| Creating the connection and consuming the invitation transactionally                                    | Veles server function            | Custom product behavior              |

## Source guidance and resulting decisions

### Better Auth: TanStack Start integration

Source: [TanStack Start Integration](https://better-auth.com/docs/integrations/tanstack)

The guide says to:

- mount `auth.handler` in a TanStack server route;
- prefer the client SDK for ordinary authentication flows;
- install `tanstackStartCookies()` as the last Better Auth plugin when server-side API calls need to set cookies.

Veles follows the handler and cookie guidance exactly. `tanstackStartCookies()` is currently the only plugin, so it is also last.

Veles deliberately does not follow the client-SDK preference for OAuth initiation. That preference is sensible for an interactive client login component, but it preserves the hydration delay this change was intended to remove. The server API used instead is explicitly supported by Better Auth, and the TanStack cookie plugin carries the generated OAuth state cookie into the outgoing response.

The implementation must not also copy the `Set-Cookie` header returned by Better Auth. `tanstackStartCookies()` already applies it through TanStack Start; copying it manually would emit the same OAuth state cookie twice.

### Better Auth: OAuth

Source: [OAuth in Better Auth 1.6](https://better-auth.com/docs/1.6/concepts/oauth)

The OAuth guide supports both:

- client-side `authClient.signIn.social(...)`; and
- server-side `auth.api.signInSocial(...)`.

Veles uses the server-side form in `/auth/google`. It passes `disableRedirect: true`, receives the provider authorization URL, and constructs the final `302` response itself. Better Auth still generates and validates OAuth state and PKCE; Veles does not implement either protocol mechanism.

The `callbackURL` means the Veles destination after Better Auth finishes the provider callback. It is not Google's registered OAuth redirect URI. Google's redirect URI remains Better Auth's callback endpoint under `/api/auth/callback/google`.

Better Auth also supports carrying custom `additionalData` through OAuth state. Veles does not use that feature for invitation acceptance. Doing so would couple connection creation to global authentication hooks without removing a meaningful user-visible request.

### Better Auth: server API

Source: [Server API in Better Auth 1.6](https://better-auth.com/docs/1.6/concepts/api)

The server API guide requires endpoint inputs under `body`, request metadata under `headers`, and documents `returnHeaders` and `asResponse` for callers that need the raw response data.

`/auth/google` follows the `body` and `headers` shape. It relies on `tanstackStartCookies()` rather than `returnHeaders`, because the integration plugin is specifically responsible for applying cookies to TanStack Start responses.

### TanStack Start: server routes

Source: [Server Routes](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes)

TanStack describes server routes as the appropriate primitive for raw HTTP endpoints and explicitly includes authentication among their uses. Both `/invite/$token` and `/auth/google` are external browser navigation endpoints that return `Response` objects, so server routes fit better than server functions.

Server functions remain appropriate for invitation acceptance because that operation is an application RPC invoked from route logic and requires typed validation plus authenticated database access.

### TanStack Router: route guards

Source: [Authenticated Routes](https://tanstack.com/router/latest/docs/guide/authenticated-routes)

TanStack recommends `beforeLoad` for route-level authentication UX and warns that route guards are not data-authorization boundaries.

Veles follows that split:

- route `beforeLoad` redirects control navigation and prevent the wrong UI from loading;
- `acceptConnectionInvitationToken` independently calls `requireSession()` and constrains its database query by the authenticated user's normalized email.

The server-function check is the actual authorization boundary. The route context check alone would not be sufficient because server functions can be called independently of a page.

## Pattern assessment

### Good patterns to preserve

#### Better Auth owns OAuth

Do not add custom state tokens, PKCE generation, callback exchange code, or session cookies. Better Auth already implements these pieces. `/auth/google` should remain a thin adapter.

#### Redirect destinations are sanitized

`getSafeRedirectPath` accepts only local paths and rejects protocol-relative and backslash-based alternatives. Any new authentication entry that accepts a destination must use the same policy. Never pass an arbitrary query value directly to Better Auth as `callbackURL`.

#### OAuth state cookies are delegated to the integration plugin

`tanstackStartCookies()` is the single cookie propagation mechanism for server-side Better Auth API calls. Avoid parallel manual forwarding.

#### Invitation acceptance is authorized at the data boundary

The acceptance query requires both the token hash and the session user's email. Possession of a token alone is not enough to connect an arbitrary signed-in account.

#### Tokens are hashed at rest and consumed transactionally

Invitation emails contain a random 32-byte base64url token. The database stores its SHA-256 hash. Successful acceptance inserts the canonical connection and removes the invitation in one transaction.

#### Authentication and connection creation remain separate

A valid invitation permits signup, but signup itself does not silently create a social connection. Keeping the product mutation in `connections.api.ts` makes its authorization and transaction visible and reusable.

### Acceptable hobby-project tradeoffs

#### A GET request starts OAuth

`GET /auth/google` creates short-lived OAuth state and sets a cookie, but it does not create an application user or connection. Using a link keeps the flow functional without hydration and matches normal OAuth authorization-entry behavior. A POST form would add machinery without a practical benefit here.

#### `/invite/$token` performs only shape validation

The route confirms that the token has the expected 43-character representation but does not query the database before redirecting to Google. This keeps a public email-link endpoint cheap and avoids duplicating invitation lookup logic. The authoritative lookup still occurs after authentication.

The tradeoff is that a revoked, used, or unknown token can take the user through Google before being discovered.

#### Invitation acceptance finishes on `/`

The home route's `beforeLoad` consumes `?invitation=...` and then removes it with a redirect. A dedicated callback page could isolate that workflow more strictly, but the current implementation is small, and the query parameter is short-lived in normal use.

### Lacking patterns and known limitations

These are known limitations, not requirements to add infrastructure preemptively.

#### Wrong-account and unavailable-token feedback is weak

`acceptConnectionInvitationToken` returns without an error when the token is absent or when its recipient email does not match the authenticated account. The user is then redirected home with no explanation, while a wrong-account invitation remains pending.

If this becomes a real support problem, return a small result enum such as `accepted | unavailable` and show a focused page that explains that the user may need a different Google account. Do not weaken the email-match authorization rule.

#### Invitations do not expire

The invitation table has `createdAt` and `updatedAt` but no expiry field, and acceptance does not enforce an age limit. Tokens are high entropy, hashed at rest, and revocable by the sender, which is reasonable for the current hobby-project threat model. Add expiry only if persistent invitations become undesirable.

#### The token is present in URLs

The invitation token appears in the email URL and briefly in the post-OAuth callback URL. This is inherent to the current bearer-link design and means it may appear in browser history or infrastructure request logs. Hashing at rest does not remove that transport exposure.

A more elaborate design could store the invitation intent in OAuth state or a short-lived HttpOnly cookie, but that would add callback-hook coupling and recovery complexity. The current design is preferred until there is a concrete need.

#### Signup authorization is coupled to a Better Auth database hook

The custom `user.create.before` hook is effective and centralized, but it is application policy inside authentication lifecycle configuration. Changes to Better Auth hooks should be checked carefully during upgrades. Moving it elsewhere would only be worthwhile if signup policy becomes more complex.

## Rules for future changes

1. Keep `/auth/google` a thin adapter around Better Auth; do not implement OAuth protocol details in Veles.
2. Keep `tanstackStartCookies()` last and do not manually duplicate its cookie forwarding.
3. Sanitize every caller-provided callback destination to a same-origin path.
4. Treat route guards as UX only. Enforce session and ownership again inside every protected server function or server route.
5. Keep invitation recipient matching in the authoritative acceptance query.
6. Do not move invitation acceptance into a Better Auth callback hook merely to eliminate one local redirect.
7. Prefer a small explicit result and focused error UI if wrong-account feedback is improved later; do not add a generalized onboarding framework.

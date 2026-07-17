## Veles

### Run

```bash
# install deps
pnpm install

# set up local env
cp .env.example .env

# start dev server on http://localhost:3000
pnpm dev
```

### Develop

```bash
pnpm test
pnpm typecheck
pnpm check

# All in one: format write, typecheck, test
pnpm check:fix
```

### Production

Configure these runtime values in Dokploy before deploying:

- `APP_URL`: the canonical public HTTPS origin, such as `https://veles.example.com`
- `AUTH_ALLOWED_EMAILS`: comma-separated Google email addresses allowed to create accounts
- `BETTER_AUTH_SECRET`: a private random value of at least 32 characters (`openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: credentials for the production origin

An empty allowlist blocks new account creation but does not revoke existing accounts. Veles only
supports Google sign-in. Configure the reverse proxy with an 85 MiB request body limit; the app
also keeps its existing limit of eight photos at 10 MiB each.

```bash
# build the app
pnpm build

# run the production server
pnpm start
```

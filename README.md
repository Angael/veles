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

```bash
# build the app
pnpm build

# run the production server
pnpm start
```

# Diary end-to-end encryption

## Context

Diary entries are the most private data in Veles. Before this change they were stored as plaintext `title` and `markdown` columns. Anyone with database access (a leaked backup, Drizzle Studio, a compromised host, the operator) could read them.

Requirements:

- Diary text must never be stored in the database in a readable form.
- The password must not be stored in the database, not even as a hash.
- The user can keep the unlocked state on a device, or enter the password every time.

## Options considered

- **Server-side encryption, key in a cookie.** Simple, and a database dump alone is useless. But the cookie goes to the server with every request, so the server decrypts every read and handles plaintext in memory. This protects against database leaks only, not against the server or operator.
- **Browser end-to-end encryption (chosen).** The browser derives the key and encrypts and decrypts. The server and database only see ciphertext. This costs server-side features (search, agent access) and makes a forgotten password unrecoverable.

## Decision

### Keys

- The browser derives a **wrapping key** from the passphrase: PBKDF2-SHA256, 600,000 iterations, random 16-byte salt, through WebCrypto. No new dependency. Argon2 would need WASM.
- A random AES-256-GCM **data key** encrypts the entries. The wrapping key wraps it (AES-GCM, random IV).
- `diary_key` (one row per user) stores only `salt`, `iterations`, and `wrapped_key`. A wrong passphrase fails AES-GCM authentication when it unwraps the key, so no password hash or verifier is needed.
- The wrapping layer lets a later passphrase change rewrap one key instead of re-encrypting every entry.

### Entries

- `diary_entry.ciphertext` stores one sealed `{ title, markdown }` JSON value as `v1.<base64 iv>.<base64 ciphertext>`. The `v1` prefix leaves room to change the format later.
- The entry id is AES-GCM additional data. A server cannot move ciphertext from one entry to another without decryption failing.
- A `null` ciphertext is a newly created, empty entry. The server can create entries without the key.
- `entry_date`, `created_at`, and `updated_at` stay plaintext. Sorting, the home dashboard "last entry" card, and backups need them. The server can see when you write, but not what.

### Key storage in the browser

- After unlock, the data key is unwrapped as **non-extractable**. Page scripts can use it but cannot read its raw bytes.
- By default it lives only in memory (`apps/web/src/lib/diaryKeyVault.ts`). A page reload asks for the passphrase again.
- "Remember on this device" also stores the `CryptoKey` in IndexedDB. The stored record includes the `wrapped_key` it unlocks, so a stale key or a key from another account is ignored.
- "Lock" and sign-out delete the key from memory and IndexedDB.
- Cookies were rejected because they are sent to the server automatically.

### Migration of existing plaintext entries

- `title` and `markdown` became nullable legacy columns.
- On first visit, the diary asks the user to set a passphrase. The browser loads the legacy plaintext, encrypts every entry, and sends the wrapped key and ciphertexts in one request.
- `setupDiaryKey` stores the key, writes the ciphertexts, and clears the plaintext in one transaction. The transaction rolls back if any entry would keep readable text.
- Every save writes `title = null, markdown = null`.

### Backups (export / import)

- Export builds the JSON file in the browser from the decrypted entries. The format is the same as before (`version: 1`), so older exports still import.
- Import parses and validates the file in the browser. It skips entries that already exist (same date, title, and text), gives each new entry a random UUID, encrypts it with that id, and uploads only ciphertext.
- The exported file is **plaintext on the user's disk**. This is deliberate: it is the user's escape hatch if they lose the passphrase or leave the app.

## Consequences

- **A forgotten passphrase means the entries are lost.** No reset exists. Keep an export.
- The agent MCP server cannot read or write the diary, so the diary is excluded from it. This is a deliberate exception to "MCP covers every feature".
- Search works only in the browser, after unlock. It already did before this change.
- A malicious or compromised server could ship JavaScript that captures the passphrase. Browser E2EE from a web app protects against database leaks and a passive operator, not against an active attacker who controls the code being served.
- Page titles for entries are generic ("Diary entry"), because the server renders them without the key.

## Follow-ups

- Change passphrase (rewrap the data key).
- "Forgot passphrase": delete all entries and start over.
- After production data is migrated, drop `diary_entry.title` and `diary_entry.markdown`.

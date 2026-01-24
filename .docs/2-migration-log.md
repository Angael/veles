# Migration Execution Log

This file tracks the actual execution of the MySQL to PostgreSQL migration.
Reference: [Migration Plan](.docs/1-mysql-to-drizzle-pg-migration.md)

---

## Pre-Migration Checklist

- [ ] Local Docker PostgreSQL running (`pnpm compose:dev`)
- [ ] MySQL dump available at `/home/vanih/Downloads/hetzner/dump.sql`
- [ ] Backup of current Veles database (if needed)
- [ ] Review migration plan document

---

## Phase 1: Schema Design ✅ COMPLETE

### Tasks
- [x] Remove existing test tables from `src/db/schema.ts` (`todos`, `notes`)
- [x] Define all pgEnum types:
  - [x] `userTypeEnum` - FREE, PREMIUM, ADMIN
  - [x] `itemTypeEnum` - IMAGE, VIDEO
  - [x] `processingStatusEnum` - NO, STARTED, FAIL, V1
  - [x] `mediaTypeEnum` - SOURCE, COMPRESSED
  - [x] `thumbnailTypeEnum` - XS, SM, MD
  - [x] `stripePlanEnum` - VIP, ACCESS_PLAN
- [x] Create table schemas:
  - [x] `users` (main auth table)
  - [x] `userSessions` (for future sessions, data not migrated)
  - [x] `stripeCustomers`
  - [x] `userWeights`
  - [x] `foodProducts`
  - [x] `foodGoals`
  - [x] `foodLogs` (FK to foodProducts)
  - [x] `items` (FK to users)
  - [x] `images` (FK to items)
  - [x] `videos` (FK to items)
  - [x] `thumbnails` (FK to items, unique constraint on itemId+type)
- [x] Removed old demo routes that referenced deleted tables
  - Deleted `src/routes/demo/drizzle.tsx`
  - Deleted `src/routes/notes/` directory
  - Removed links from `src/components/Header.tsx`

### Notes
- All foreign keys properly defined with onUpdate: 'cascade' where applicable
- Indexes created to match MySQL originals
- TypeScript compiles successfully
- Biome lint/format passes

---

## Phase 2: Local Database Setup ✅ COMPLETE

### Tasks
- [x] Start Docker PostgreSQL: `pnpm compose:dev` (started by user)
- [x] Drop old test tables: `DROP TABLE IF EXISTS todos, notes CASCADE`
- [x] Push schema: `pnpm db:push` (used push instead of generate/migrate for clean slate)
- [x] Verify tables created: `\dt` - 11 tables
- [x] Check ENUM types created: `\dT+` - 6 ENUMs

### Tables Created
- food_goal, food_log, food_product
- image, item, video, thumbnail
- user, user_session, user_weight
- stripe_customer

### ENUMs Created
- user_type (FREE, PREMIUM, ADMIN)
- item_type (IMAGE, VIDEO)
- processing_status (NO, STARTED, FAIL, V1)
- media_type (SOURCE, COMPRESSED)
- thumbnail_type (XS, SM, MD)
- stripe_plan (VIP, ACCESS_PLAN)

### Notes
- Used `db:push` instead of `db:generate`/`db:migrate` since old tables existed and drizzle was asking about renames
- Foreign keys verified working (item → user, image/video/thumbnail → item)
- Indexes created as expected

---

## Phase 3: Data Conversion ✅ COMPLETE

### Tasks
- [x] Create conversion script at `scripts/convert-mysql-to-pg.ts`
- [x] Parse MySQL dump file
- [x] Filter out skipped tables (user_session, migrations, migration_lock)
- [x] Convert INSERT statements:
  - [x] Handle ENUM value conversions (direct string match)
  - [x] Convert datetime to timestamp format (works as-is)
  - [x] Handle NULL values
  - [x] Remove MySQL-specific syntax (backticks → double quotes)
  - [x] Convert tinyint(1) → boolean (0 → false, 1 → true)
- [x] Reset sequences after import
- [x] Wrap in transaction (BEGIN/COMMIT)

### Script Location
`scripts/convert-mysql-to-pg.ts`

### Usage
```bash
# Generate SQL and pipe to database
pnpm tsx scripts/convert-mysql-to-pg.ts /path/to/dump.sql | psql -U postgres -d veles_dev

# Or for Docker:
pnpm tsx scripts/convert-mysql-to-pg.ts /path/to/dump.sql | docker exec -i veles-db-1 psql -U postgres -d veles_dev
```

### Conversion Issues Fixed
- Boolean columns: MySQL uses `0`/`1`, PostgreSQL needs `true`/`false`
  - Added `BOOLEAN_COLUMNS` mapping for `item.private`

---

## Phase 4: Data Import to Local Database ✅ COMPLETE

### Tasks
- [x] Import data via piped script output
- [x] Reset sequences (handled automatically by script)
- [x] Verify row counts

### Row Count Verification

| Table | Expected | Actual |
|-------|----------|--------|
| user | 8 | 8 ✅ |
| stripe_customer | 1 | 1 ✅ |
| user_weight | 63 | 63 ✅ |
| food_product | 147 | 147 ✅ |
| food_goal | 1 | 1 ✅ |
| food_log | 315 | 315 ✅ |
| item | 365 | 365 ✅ |
| image | 55 | 55 ✅ |
| video | 616 | 616 ✅ |
| thumbnail | 723 | 723 ✅ |

### Notes
- Import ran successfully within transaction
- All sequences reset to MAX(id)
- FK constraints satisfied (data imported in correct order)

---

## Phase 5: Testing & Production Import ✅ COMPLETE

### Tasks
- [x] Test Drizzle queries locally (created /items page)
- [x] Verify data loads correctly

### Production Import
- [x] Run schema migration: `pnpm db:migrate:prod`
- [x] Import data using `scripts/import-to-db.ts`

### Production Row Counts (Verified)
| Table | Rows |
|-------|------|
| user | 8 |
| stripe_customer | 1 |
| user_weight | 63 |
| food_product | 147 |
| food_goal | 1 |
| food_log | 315 |
| item | 365 |
| image | 55 |
| video | 616 |
| thumbnail | 723 |

### Scripts Created
- `scripts/convert-mysql-to-pg.ts` - Outputs SQL to stdout
- `scripts/import-to-db.ts` - Direct import via Node.js (no psql needed)

---

## Summary ✅ MIGRATION COMPLETE

### Statistics
- **Tables migrated:** 10 (user, stripe_customer, user_weight, food_product, food_goal, food_log, item, image, video, thumbnail)
- **Tables skipped:** 3 (user_session data, migrations, migration_lock)
- **Total rows migrated:** 2,294
- **ENUMs created:** 6

### Files Created/Modified
- `src/db/schema.ts` - Complete Drizzle schema
- `drizzle/0000_unique_black_tarantula.sql` - Migration file
- `scripts/convert-mysql-to-pg.ts` - SQL conversion script
- `scripts/import-to-db.ts` - Direct Node.js import script
- `src/routes/items.tsx` - Test page for verification

### Lessons Learned
- `db:push` bypasses migration generation - use `db:generate` for production
- MySQL `tinyint(1)` needs explicit conversion to PostgreSQL `boolean`
- Direct Node.js import avoids need for psql CLI

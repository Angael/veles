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

## Phase 3: Data Conversion

### Tasks
- [ ] Create conversion script at `scripts/convert-mysql-to-pg.js`
- [ ] Parse MySQL dump file
- [ ] Filter out skipped tables (user_session, migrations, migration_lock)
- [ ] Convert INSERT statements:
  - [ ] Handle ENUM value conversions
  - [ ] Convert datetime to timestamp format
  - [ ] Handle NULL values
  - [ ] Remove MySQL-specific syntax (backticks, LOCK TABLES, etc.)
- [ ] Output to `data.sql`

### Script Location
-

### Output File
-

### Conversion Issues
-

---

## Phase 4: Data Import to Local Database

### Tasks
- [ ] Import data: `psql -U postgres -d veles_dev -f data.sql`
- [ ] Reset sequences:
  - [ ] `item_id_seq`
  - [ ] `image_id_seq`
  - [ ] (other serial sequences)
- [ ] Verify row counts:
  - [ ] `user`: Expected 8
  - [ ] `food_log`: Expected 323
  - [ ] `item`: Expected 414
  - [ ] `image`: Expected 83
- [ ] Test FK constraints
- [ ] Check for orphaned records

### Row Count Verification
```sql
-- Actual counts after import
SELECT 'user' AS table_name, COUNT(*) FROM user
UNION ALL
SELECT 'food_log', COUNT(*) FROM food_log
UNION ALL
SELECT 'item', COUNT(*) FROM item
UNION ALL
SELECT 'image', COUNT(*) FROM image;
```

**Results:**
-

### FK Constraint Check
```sql
-- Check for orphaned records
SELECT COUNT(*) FROM item WHERE user_id NOT IN (SELECT id FROM user);
SELECT COUNT(*) FROM image WHERE item_id NOT IN (SELECT id FROM item);
SELECT COUNT(*) FROM food_log WHERE food_product_id IS NOT NULL
  AND food_product_id NOT IN (SELECT id FROM food_product);
```

**Results:**
-

### Issues Encountered
-

---

## Phase 5: Testing & Dump Creation

### Tasks
- [ ] Test Drizzle queries:
  - [ ] Select users
  - [ ] Select items with user join
  - [ ] Select images with item join
  - [ ] Test ENUM filtering
- [ ] Verify timestamps are correct
- [ ] Check data integrity
- [ ] Create PostgreSQL dump: `pg_dump -U postgres veles_dev > production-backup.sql`
- [ ] Verify dump file size and contents
- [ ] Copy dump to production backup location

### Test Queries
```typescript
// Add test queries executed here
```

### Dump Details
- **File location:**
- **File size:**
- **Production backup path:**

### Issues Encountered
-

---

## Phase 6: Production Deployment (Future)

### Pre-Deployment
- [ ] Verify application code works with new schema
- [ ] Test all endpoints
- [ ] Backup production database
- [ ] Plan downtime window (if needed)

### Deployment
- [ ] Deploy application with new schema
- [ ] Restore from backup dump
- [ ] Verify production data
- [ ] Monitor for errors

### Post-Deployment
- [ ] Verify user logins work
- [ ] Check data displays correctly
- [ ] Monitor application logs
- [ ] Archive old MySQL dump

---

## Summary

### Timeline
- **Start:**
- **End:**
- **Total Duration:**

### Statistics
- **Tables migrated:**
- **Total rows migrated:**
- **Database size:**

### Lessons Learned
-

### Remaining TODOs
-

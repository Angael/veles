# MySQL to Drizzle PostgreSQL Migration Plan

## Overview
Migrating data from MySQL dump (`dump.sql`, 275KB) to Drizzle ORM with PostgreSQL.

**Database:** cerebro2 (food tracking + media management app)
**Target:** Veles project using Drizzle ORM + PostgreSQL

**Execution Tracking:** See [Migration Log](./2-migration-log.md) for actual execution progress and checklist.

---

## Schema Summary

### Tables to Migrate (with Row Counts)
- `user` (8 rows) - Auth with email, hashed passwords, user types
- `food_goal` (1 row) - Daily nutrition goals
- `food_log` (323 rows) - Food intake entries
- `food_product` - Product database
- `user_weight` - Weight tracking history
- `item` (414 rows) - Media items (images/videos)
- `image` (83 rows) - Image metadata & paths
- `video` - Video metadata
- `thumbnail` - Image thumbnails
- `stripe_customer` - Payment integration

### Tables to SKIP
- `user_session` - Old session data, not migrating
- `migrations`, `migration_lock` - Old Kysely migration tables (Drizzle handles migrations)

### Key Relationships
```
user ←─ item ←─ image
     └─ food_log ─→ food_product
     └─ stripe_customer
```

---

## Migration Target & Strategy

### Deployment Flow
1. **Local Development**: Migrate to local Docker PostgreSQL instance
2. **Create Dump**: Export the migrated database to SQL dump
3. **Production**: Add dump to production backup system for recovery

### Existing Schema Cleanup
Current `src/db/schema.ts` contains test tables (`todos`, `notes`) that will be completely replaced with the migrated schema.

---

## Migration Strategy: Schema-First

**Steps:**
1. Write Drizzle schema manually based on MySQL dump analysis
2. Run `pnpm db:generate` to create migrations
3. Run `pnpm db:migrate` to create tables in local Docker PostgreSQL
4. Convert MySQL dump data to PostgreSQL INSERT statements
5. Import data directly
6. Verify data integrity
7. Create PostgreSQL dump for production backup

**Why Schema-First:**
- Full control over schema design
- Can improve schema during migration (better naming, constraints)
- Drizzle-native from the start
- Clean migration history
- Understanding of every field and relationship

**Estimated time:** 4-6 hours

---

## MySQL → PostgreSQL Drizzle Conversions

### Data Types

| MySQL | PostgreSQL | Drizzle |
|-------|------------|---------|
| `int AUTO_INCREMENT` | `SERIAL` | `serial()` |
| `int unsigned` | `integer` + CHECK | `integer()` (no unsigned in PG) |
| `varchar(255)` | `varchar(255)` | `varchar({ length: 255 })` or `text()` |
| `float` | `real` or `double precision` | `real()` or `doublePrecision()` |
| `date` | `date` | `date()` |
| `datetime(3)` | `timestamp(3)` | `timestamp({ precision: 3, mode: 'date' })` |
| `timestamp` | `timestamp` | `timestamp({ mode: 'date' })` |
| `tinyint(1)` (boolean) | `boolean` | `boolean()` |
| `enum('A','B')` | `user_defined_enum` | `pgEnum('name', ['A', 'B'])` |

### ENUM Types in Drizzle

MySQL dump has these ENUMs:
```sql
-- user.type
enum('FREE','PREMIUM','ADMIN')

-- item.type
enum('IMAGE','VIDEO')

-- item.processed, item.optimized
enum('NO','STARTED','FAIL','V1')

-- image.media_type
enum('SOURCE','COMPRESSED')
```

Drizzle approach:
```typescript
import { pgEnum } from 'drizzle-orm/pg-core';

export const userTypeEnum = pgEnum('user_type', ['FREE', 'PREMIUM', 'ADMIN']);
export const itemTypeEnum = pgEnum('item_type', ['IMAGE', 'VIDEO']);
export const processingStatusEnum = pgEnum('processing_status', ['NO', 'STARTED', 'FAIL', 'V1']);
export const mediaTypeEnum = pgEnum('media_type', ['SOURCE', 'COMPRESSED']);
```

### Foreign Keys

Example from MySQL:
```sql
CONSTRAINT `food_log_ibfk_1` FOREIGN KEY (`food_product_id`) REFERENCES `food_product` (`id`)
CONSTRAINT `item_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE
```

Drizzle approach:
```typescript
import { pgTable, integer, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('user', {
  id: varchar({ length: 64 }).primaryKey(),
  // ...
});

export const items = pgTable('item', {
  id: serial().primaryKey(),
  userId: varchar('user_id', { length: 64 })
    .notNull()
    .references(() => users.id, { onUpdate: 'cascade' }),
  // ...
});
```

### Default Values & Timestamps

MySQL `ON UPDATE CURRENT_TIMESTAMP` **does not exist in PostgreSQL**.

**Solutions:**
1. **Application-level** (RECOMMENDED): Update `updatedAt` in your mutations
2. **Database trigger**: Create PostgreSQL trigger function
3. **Drizzle hook**: Use `.$onUpdate()` when available

MySQL:
```sql
created_at datetime(3) DEFAULT CURRENT_TIMESTAMP(3)
updated_at datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
```

Drizzle:
```typescript
createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow(),
updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' }).defaultNow(),
// Update in application code on mutations
```

---

## Example Drizzle Schema

Based on your MySQL dump, here's how the user and item tables would look:

```typescript
import { pgTable, serial, varchar, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';

// ENUMs
export const userTypeEnum = pgEnum('user_type', ['FREE', 'PREMIUM', 'ADMIN']);
export const itemTypeEnum = pgEnum('item_type', ['IMAGE', 'VIDEO']);
export const processingStatusEnum = pgEnum('processing_status', ['NO', 'STARTED', 'FAIL', 'V1']);

// Tables
export const users = pgTable('user', {
  id: varchar({ length: 64 }).primaryKey(),
  email: varchar({ length: 254 }).notNull().unique(),
  hashedPassword: varchar('hashed_password', { length: 256 }).notNull(),
  type: userTypeEnum('type').notNull(),
  lastLoginAt: timestamp('last_login_at', { precision: 3, mode: 'date' }),
  createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' }).defaultNow(),
});

export const items = pgTable('item', {
  id: serial().primaryKey(),
  userId: varchar('user_id', { length: 64 })
    .notNull()
    .references(() => users.id, { onUpdate: 'cascade' }),
  private: boolean().notNull().default(false),
  type: itemTypeEnum('type').notNull(),
  processed: processingStatusEnum('processed').notNull().default('NO'),
  optimized: processingStatusEnum('optimized').notNull().default('NO'),
  createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3, mode: 'date' }).defaultNow(),
});

export const images = pgTable('image', {
  id: serial().primaryKey(),
  itemId: integer('item_id')
    .notNull()
    .references(() => items.id, { onUpdate: 'cascade' }),
  path: varchar({ length: 256 }).notNull(),
  size: integer().notNull(),
  width: integer().notNull(),
  height: integer().notNull(),
  mediaType: mediaTypeEnum('media_type').notNull(),
  createdAt: timestamp('created_at', { precision: 3, mode: 'date' }).defaultNow(),
});
```

---

## Data Import Strategy

### Step 1: Extract data from MySQL dump
Create a conversion script to:
1. Parse MySQL INSERT statements
2. Convert data types (ENUMs to strings, datetime formats)
3. Generate PostgreSQL-compatible INSERT statements

### Step 2: Handle special cases
- **User IDs**: Already using string IDs (good for PG)
- **Timestamps**: Convert MySQL datetime format to PostgreSQL timestamp
- **ENUM values**: Ensure exact string matches
- **NULL handling**: Should work as-is

### Step 3: Import order (respect FK constraints)
1. `user`
2. `stripe_customer`, `user_weight`
3. `food_product`
4. `food_goal`, `food_log`
5. `item`
6. `image`, `video`, `thumbnail`

**Note:** Skip `user_session` and `migrations`/`migration_lock` tables entirely.

### Step 4: Verify data integrity
```sql
-- Check row counts match
SELECT COUNT(*) FROM user;
SELECT COUNT(*) FROM item;
SELECT COUNT(*) FROM image;

-- Check FK relationships
SELECT COUNT(*) FROM item WHERE user_id NOT IN (SELECT id FROM user);
SELECT COUNT(*) FROM image WHERE item_id NOT IN (SELECT id FROM item);
```

---

## Action Plan

**Phase 1: Schema Design (2-3 hours)**
1. Remove existing test tables (`todos`, `notes`) from `src/db/schema.ts`
2. Create comprehensive Drizzle schema based on MySQL dump
3. Define all ENUMs first
4. Create tables in dependency order
5. Add all foreign key relationships

**Phase 2: Local Database Setup (30 mins)**
1. Ensure local Docker PostgreSQL is running (`pnpm compose:dev`)
2. Run `pnpm db:generate` to create migration
3. Run `pnpm db:migrate` to apply migration to local database
4. Verify schema with `pnpm db:studio`

**Phase 3: Data Conversion (1-2 hours)**
1. Write Node.js script to parse MySQL dump
2. Filter out `user_session`, `migrations`, `migration_lock` tables
3. Convert INSERT statements to PostgreSQL format
4. Handle data type conversions (ENUMs, timestamps, etc.)
5. Output clean SQL file

**Phase 4: Data Import to Local Database (30 mins)**
1. Import data using `psql` to local Docker PostgreSQL
2. Reset sequences (AUTO_INCREMENT counters)
3. Verify row counts match expectations
4. Test FK constraints
5. Check for data integrity issues

**Phase 5: Testing & Dump Creation (1 hour)**
1. Test queries with Drizzle
2. Ensure all relationships work
3. Create PostgreSQL dump from local database
4. Add dump to production backup location
5. Archive original MySQL dump

**Phase 6: Production Deployment (when ready)**
1. Deploy application with new schema
2. Restore from backup dump to production PostgreSQL
3. Verify production data

---

## Potential Issues & Solutions

### Issue: AUTO_INCREMENT sequences
**Problem:** Imported data has explicit IDs, sequence may be out of sync
**Solution:** Reset PostgreSQL sequences after import
```sql
SELECT setval('item_id_seq', (SELECT MAX(id) FROM item));
SELECT setval('image_id_seq', (SELECT MAX(id) FROM image));
```

### Issue: Updated_at won't auto-update
**Problem:** PostgreSQL doesn't support ON UPDATE CURRENT_TIMESTAMP
**Solution:** Update timestamps in application code whenever updating records
```typescript
await db.update(items)
  .set({ optimized: 'V1', updatedAt: new Date() })
  .where(eq(items.id, itemId));
```

### Issue: ENUM type changes
**Problem:** Adding/removing ENUM values requires migrations
**Solution:** Use ALTER TYPE in migrations or consider using text with constraints for flexibility

### Issue: Large file paths
**Problem:** Some paths in `image.path` may be very long
**Solution:** Use `text()` instead of `varchar()` for path fields

---

## Tools & Commands

### Start local PostgreSQL
```bash
pnpm compose:dev
```

### Drizzle commands during migration
```bash
pnpm db:generate   # Generate migration from schema changes
pnpm db:migrate    # Apply migrations to local database
pnpm db:studio     # Visual database browser
```

### Convert MySQL dump to PostgreSQL
```bash
# Custom Node.js script (to be created)
node scripts/convert-mysql-to-pg.js /home/vanih/Downloads/hetzner/dump.sql > data.sql
```

### Import data to local PostgreSQL
```bash
# Import converted data
psql -U postgres -d veles_dev -f data.sql

# Or connect to Docker container first
docker exec -i veles-db-1 psql -U postgres -d veles_dev < data.sql
```

### Reset sequences after data import
```sql
-- Reset all sequences to match imported data
SELECT setval('item_id_seq', (SELECT MAX(id) FROM item));
SELECT setval('image_id_seq', (SELECT MAX(id) FROM image));
-- Repeat for all SERIAL columns
```

### Create dump for production
```bash
# Dump from local Docker PostgreSQL
docker exec -t veles-db-1 pg_dump -U postgres veles_dev > production-backup.sql

# Or using pg_dump directly
pg_dump -h localhost -U postgres -d veles_dev > production-backup.sql
```

### Useful SQL for debugging
```sql
-- List all tables
\dt

-- Describe table structure
\d user
\d item

-- Check ENUM types
\dT+

-- View constraints
\d+ item

-- Count rows
SELECT COUNT(*) FROM user;
SELECT COUNT(*) FROM item;
SELECT COUNT(*) FROM image;
```

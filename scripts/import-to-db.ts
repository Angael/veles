/**
 * Import converted MySQL data directly to PostgreSQL using Node.js
 *
 * Usage:
 *   pnpm tsx scripts/import-to-db.ts <dump.sql> <database_url>
 *
 * Example:
 *   pnpm tsx scripts/import-to-db.ts /path/to/dump.sql $PROD_DATABASE_URL
 */

import { readFileSync } from 'node:fs';
import pg from 'pg';

// Tables to migrate (in order for FK constraints)
const TABLES_TO_MIGRATE = [
	'user',
	'stripe_customer',
	'user_weight',
	'food_product',
	'food_goal',
	'food_log',
	'item',
	'image',
	'video',
	'thumbnail',
];

// Tables to skip
const TABLES_TO_SKIP = ['user_session', 'migrations', 'migration_lock'];

// Column indices that need boolean conversion (0-indexed)
const BOOLEAN_COLUMNS: Record<string, number[]> = {
	item: [2], // `private` is the 3rd column (index 2)
};

function parseArgs(): { dumpPath: string; dbUrl: string } {
	const args = process.argv.slice(2);
	if (args.length < 2) {
		console.error(
			'Usage: pnpm tsx scripts/import-to-db.ts <dump.sql> <database_url>',
		);
		process.exit(1);
	}
	return { dumpPath: args[0], dbUrl: args[1] };
}

function extractInsertStatements(
	content: string,
): Map<string, { values: string[] }> {
	const result = new Map<string, { values: string[] }>();

	const insertRegex = /INSERT INTO `(\w+)` VALUES (.+);/g;

	let match: RegExpExecArray | null;
	while ((match = insertRegex.exec(content)) !== null) {
		const tableName = match[1];
		const valuesStr = match[2];

		if (TABLES_TO_SKIP.includes(tableName)) continue;
		if (!TABLES_TO_MIGRATE.includes(tableName)) continue;

		const rows = parseValueRows(valuesStr);

		if (result.has(tableName)) {
			result.get(tableName)!.values.push(...rows);
		} else {
			result.set(tableName, { values: rows });
		}
	}

	return result;
}

function parseValueRows(valuesStr: string): string[] {
	const rows: string[] = [];
	let current = '';
	let depth = 0;
	let inString = false;
	let stringChar = '';
	let i = 0;

	while (i < valuesStr.length) {
		const char = valuesStr[i];
		const nextChar = valuesStr[i + 1];

		if (inString && char === '\\' && nextChar) {
			current += char + nextChar;
			i += 2;
			continue;
		}

		if ((char === "'" || char === '"') && !inString) {
			inString = true;
			stringChar = char;
			current += char;
			i++;
			continue;
		}

		if (inString && char === stringChar) {
			inString = false;
			stringChar = '';
			current += char;
			i++;
			continue;
		}

		if (!inString) {
			if (char === '(') {
				depth++;
				if (depth === 1) {
					current = '(';
					i++;
					continue;
				}
			} else if (char === ')') {
				depth--;
				current += char;
				if (depth === 0) {
					rows.push(current);
					current = '';
					i++;
					continue;
				}
			} else if (char === ',' && depth === 0) {
				i++;
				continue;
			}
		}

		current += char;
		i++;
	}

	return rows;
}

function convertValueToPostgres(value: string): string {
	if (value === 'NULL') return 'NULL';
	if (value === "''") return "''";

	if (value.startsWith("'") && value.endsWith("'")) {
		let inner = value.slice(1, -1);
		inner = inner
			.replace(/\\'/g, "''")
			.replace(/\\"/g, '"')
			.replace(/\\\\/g, '\\');
		return `'${inner}'`;
	}

	if (/^-?\d+(\.\d+)?$/.test(value)) return value;

	return value;
}

function convertRowToPostgres(row: string, tableName?: string): string {
	const inner = row.slice(1, -1);
	const rawValues: string[] = [];
	let current = '';
	let inString = false;
	let stringChar = '';
	let i = 0;

	while (i < inner.length) {
		const char = inner[i];
		const nextChar = inner[i + 1];

		if (inString && char === '\\' && nextChar) {
			current += char + nextChar;
			i += 2;
			continue;
		}

		if ((char === "'" || char === '"') && !inString) {
			inString = true;
			stringChar = char;
			current += char;
			i++;
			continue;
		}

		if (inString && char === stringChar) {
			inString = false;
			stringChar = '';
			current += char;
			i++;
			continue;
		}

		if (!inString && char === ',') {
			rawValues.push(current.trim());
			current = '';
			i++;
			continue;
		}

		current += char;
		i++;
	}

	if (current.trim()) rawValues.push(current.trim());

	const booleanIndices = tableName ? BOOLEAN_COLUMNS[tableName] || [] : [];
	const values = rawValues.map((val, idx) => {
		if (booleanIndices.includes(idx)) {
			if (val === '0') return 'false';
			if (val === '1') return 'true';
		}
		return convertValueToPostgres(val);
	});

	return `(${values.join(', ')})`;
}

async function main() {
	const { dumpPath, dbUrl } = parseArgs();

	console.log(`Reading MySQL dump from: ${dumpPath}`);
	const content = readFileSync(dumpPath, 'utf-8');

	console.log('Extracting INSERT statements...');
	const data = extractInsertStatements(content);

	console.log('Tables found:');
	for (const [table, tableData] of data.entries()) {
		console.log(`  - ${table}: ${tableData.values.length} rows`);
	}

	console.log('\nConnecting to database...');
	const client = new pg.Client({ connectionString: dbUrl });
	await client.connect();

	try {
		await client.query('BEGIN');

		for (const tableName of TABLES_TO_MIGRATE) {
			const tableData = data.get(tableName);
			if (!tableData || tableData.values.length === 0) {
				console.log(`Skipping ${tableName} (no data)`);
				continue;
			}

			console.log(`Importing ${tableName} (${tableData.values.length} rows)...`);

			const BATCH_SIZE = 100;
			for (let i = 0; i < tableData.values.length; i += BATCH_SIZE) {
				const batch = tableData.values.slice(i, i + BATCH_SIZE);
				const convertedRows = batch.map((row) =>
					convertRowToPostgres(row, tableName),
				);
				const sql = `INSERT INTO "${tableName}" VALUES\n${convertedRows.join(',\n')};`;
				await client.query(sql);
			}
		}

		// Reset sequences
		console.log('\nResetting sequences...');
		const sequenceTables = [
			'food_goal',
			'food_log',
			'food_product',
			'user_weight',
			'item',
			'image',
			'video',
			'thumbnail',
		];
		for (const table of sequenceTables) {
			await client.query(
				`SELECT setval('${table}_id_seq', COALESCE((SELECT MAX(id) FROM "${table}"), 1));`,
			);
		}

		await client.query('COMMIT');
		console.log('\n✅ Import completed successfully!');

		// Verify counts
		console.log('\nVerifying row counts:');
		for (const tableName of TABLES_TO_MIGRATE) {
			const result = await client.query(
				`SELECT COUNT(*) FROM "${tableName}"`,
			);
			console.log(`  ${tableName}: ${result.rows[0].count}`);
		}
	} catch (error) {
		await client.query('ROLLBACK');
		console.error('❌ Import failed, rolled back:', error);
		process.exit(1);
	} finally {
		await client.end();
	}
}

main();

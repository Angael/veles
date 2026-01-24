/**
 * MySQL to PostgreSQL Data Conversion Script
 *
 * Parses MySQL dump and outputs PostgreSQL-compatible INSERT statements.
 *
 * Usage:
 *   pnpm tsx scripts/convert-mysql-to-pg.ts /path/to/dump.sql > data.sql
 *
 * Then import with:
 *   psql -U postgres -d veles_dev -f data.sql
 *   # Or for Docker:
 *   docker exec -i veles-db-1 psql -U postgres -d veles_dev < data.sql
 */

import { readFileSync } from 'node:fs';

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
// These are tinyint(1) in MySQL that become boolean in PostgreSQL
const BOOLEAN_COLUMNS: Record<string, number[]> = {
	item: [2], // `private` is the 3rd column (index 2)
};

function parseArgs(): string {
	const args = process.argv.slice(2);
	if (args.length === 0) {
		console.error('Usage: pnpm tsx scripts/convert-mysql-to-pg.ts <dump.sql>');
		process.exit(1);
	}
	return args[0];
}

function extractInsertStatements(
	content: string,
): Map<string, { columns: string[]; values: string[] }> {
	const result = new Map<string, { columns: string[]; values: string[] }>();

	// Match INSERT INTO `table_name` VALUES (...);
	const insertRegex = /INSERT INTO `(\w+)` VALUES (.+);/g;

	let match: RegExpExecArray | null;
	while ((match = insertRegex.exec(content)) !== null) {
		const tableName = match[1];
		const valuesStr = match[2];

		if (TABLES_TO_SKIP.includes(tableName)) {
			continue;
		}

		if (!TABLES_TO_MIGRATE.includes(tableName)) {
			console.error(`Warning: Unknown table "${tableName}" found, skipping`);
			continue;
		}

		// Parse the values - they're in format (v1,v2,v3),(v1,v2,v3),...
		const rows = parseValueRows(valuesStr);

		if (result.has(tableName)) {
			const existing = result.get(tableName)!;
			existing.values.push(...rows);
		} else {
			result.set(tableName, { columns: [], values: rows });
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

		// Handle escape sequences
		if (inString && char === '\\' && nextChar) {
			current += char + nextChar;
			i += 2;
			continue;
		}

		// Handle string boundaries
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

		// Handle parentheses (only outside strings)
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
				// Skip comma between rows
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
	// Convert MySQL-specific values to PostgreSQL

	// Handle NULL
	if (value === 'NULL') {
		return 'NULL';
	}

	// Handle empty string check first
	if (value === "''") {
		return "''";
	}

	// Handle strings - convert escape sequences
	if (value.startsWith("'") && value.endsWith("'")) {
		let inner = value.slice(1, -1);

		// MySQL uses \' for escaping, PostgreSQL uses ''
		// But we need to be careful with other escapes like \n, \t
		inner = inner
			.replace(/\\'/g, "''") // \' -> ''
			.replace(/\\"/g, '"') // \" -> "
			.replace(/\\\\/g, '\\'); // \\ -> \

		return `'${inner}'`;
	}

	// Handle numbers
	if (/^-?\d+(\.\d+)?$/.test(value)) {
		return value;
	}

	return value;
}

function convertRowToPostgres(row: string, tableName?: string): string {
	// Remove outer parentheses
	const inner = row.slice(1, -1);

	// Parse individual values
	const rawValues: string[] = [];
	let current = '';
	let inString = false;
	let stringChar = '';
	let i = 0;

	while (i < inner.length) {
		const char = inner[i];
		const nextChar = inner[i + 1];

		// Handle escape sequences in strings
		if (inString && char === '\\' && nextChar) {
			current += char + nextChar;
			i += 2;
			continue;
		}

		// Handle string start
		if ((char === "'" || char === '"') && !inString) {
			inString = true;
			stringChar = char;
			current += char;
			i++;
			continue;
		}

		// Handle string end
		if (inString && char === stringChar) {
			inString = false;
			stringChar = '';
			current += char;
			i++;
			continue;
		}

		// Handle comma separator (outside strings)
		if (!inString && char === ',') {
			rawValues.push(current.trim());
			current = '';
			i++;
			continue;
		}

		current += char;
		i++;
	}

	// Don't forget the last value
	if (current.trim()) {
		rawValues.push(current.trim());
	}

	// Convert values, handling boolean columns
	const booleanIndices = tableName ? BOOLEAN_COLUMNS[tableName] || [] : [];
	const values = rawValues.map((val, idx) => {
		// Handle boolean columns (MySQL tinyint(1) -> PostgreSQL boolean)
		if (booleanIndices.includes(idx)) {
			if (val === '0') return 'false';
			if (val === '1') return 'true';
		}
		return convertValueToPostgres(val);
	});

	return `(${values.join(', ')})`;
}

function generatePostgresSQL(
	data: Map<string, { columns: string[]; values: string[] }>,
): string {
	const lines: string[] = [];

	lines.push('-- PostgreSQL data import generated from MySQL dump');
	lines.push('-- Generated: ' + new Date().toISOString());
	lines.push('');
	lines.push('BEGIN;');
	lines.push('');

	// Process tables in order
	for (const tableName of TABLES_TO_MIGRATE) {
		const tableData = data.get(tableName);
		if (!tableData || tableData.values.length === 0) {
			lines.push(`-- No data for table: ${tableName}`);
			lines.push('');
			continue;
		}

		lines.push(`-- Table: ${tableName} (${tableData.values.length} rows)`);

		// Convert each row and create INSERT statements
		// PostgreSQL works better with smaller batches
		const BATCH_SIZE = 100;
		for (let i = 0; i < tableData.values.length; i += BATCH_SIZE) {
			const batch = tableData.values.slice(i, i + BATCH_SIZE);
			const convertedRows = batch.map((row) => convertRowToPostgres(row, tableName));
			lines.push(`INSERT INTO "${tableName}" VALUES`);
			lines.push(convertedRows.join(',\n') + ';');
			lines.push('');
		}
	}

	// Reset sequences
	lines.push('-- Reset sequences to match imported data');
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
		lines.push(
			`SELECT setval('${table}_id_seq', COALESCE((SELECT MAX(id) FROM "${table}"), 1));`,
		);
	}
	lines.push('');

	lines.push('COMMIT;');
	lines.push('');
	lines.push('-- Verification queries');
	lines.push('-- SELECT table_name, COUNT(*) FROM (');
	for (const tableName of TABLES_TO_MIGRATE) {
		lines.push(`--   SELECT '${tableName}' as table_name FROM "${tableName}"`);
		if (tableName !== TABLES_TO_MIGRATE[TABLES_TO_MIGRATE.length - 1]) {
			lines.push('--   UNION ALL');
		}
	}
	lines.push('-- ) t GROUP BY table_name ORDER BY table_name;');

	return lines.join('\n');
}

function main() {
	const dumpPath = parseArgs();

	console.error(`Reading MySQL dump from: ${dumpPath}`);
	const content = readFileSync(dumpPath, 'utf-8');

	console.error('Extracting INSERT statements...');
	const data = extractInsertStatements(content);

	console.error('Tables found:');
	for (const [table, tableData] of data.entries()) {
		console.error(`  - ${table}: ${tableData.values.length} rows`);
	}

	console.error('Generating PostgreSQL SQL...');
	const sql = generatePostgresSQL(data);

	// Output to stdout
	console.log(sql);

	console.error('Done! Pipe stdout to a file or psql.');
}

main();

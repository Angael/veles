#!/usr/bin/env node

import pg from 'pg';

const MAX_RETRIES = 30;
const RETRY_DELAY_MS = 2000;

async function waitForDatabase() {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		console.error('❌ DATABASE_URL environment variable is not set');
		process.exit(1);
	}

	console.log('⏳ Waiting for database to be ready...');
	console.log(`   Using: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);

	for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
		const client = new pg.Client({
			connectionString: databaseUrl,
			connectionTimeoutMillis: 5000,
		});

		try {
			await client.connect();
			await client.query('SELECT 1');
			await client.end();

			console.log(`✅ Database is ready! (attempt ${attempt}/${MAX_RETRIES})`);
			process.exit(0);
		} catch (error) {
			await client.end().catch(() => {});

			const isLastAttempt = attempt === MAX_RETRIES;

			if (isLastAttempt) {
				console.error(`❌ Failed to connect to database after ${MAX_RETRIES} attempts`);
				console.error(`   Error: ${error.message}`);
				process.exit(1);
			}

			console.log(`⚠️  Connection attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`);
			console.log(`   Retrying in ${RETRY_DELAY_MS / 1000}s...`);

			await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
		}
	}
}

waitForDatabase();

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { logger as baseLogger } from '../src/lib/logger.ts'

const logger = baseLogger.child({}, { msgPrefix: '[check-env-sync] ' })

const ROOT = resolve(import.meta.dirname, '..')

function readLines(filePath: string): string[] {
	const full = resolve(ROOT, filePath)
	if (!existsSync(full)) return []
	return readFileSync(full, 'utf-8').split('\n')
}

function extractEnvKeys(lines: string[]): string[] {
	return lines
		.map((l) => l.trim())
		.filter((l) => l && !l.startsWith('#'))
		.map((l) => l.split('=')[0])
		.filter(Boolean)
}

let hasIssues = false

function note(msg: string) {
	logger.warn(msg)
	hasIssues = true
}

// ─── 1. Compare .env and .env.example keys ──────────────────────────
// console.log('Checking .env vs .env.example...')

const envKeys = new Set(extractEnvKeys(readLines('.env')))
const exampleKeys = new Set(extractEnvKeys(readLines('.env.example')))

for (const key of exampleKeys) {
	if (!envKeys.has(key)) {
		note(`${key} is in .env.example but missing from .env`)
	}
}
for (const key of envKeys) {
	if (!exampleKeys.has(key)) {
		note(`${key} is in .env but missing from .env.example`)
	}
}

// ─── 2. Check Dockerfile has ARG/ENV for VITE_ keys ─────────────────
// console.log('Checking Dockerfile for VITE_ build args...')

const dockerfileContent = readLines('Dockerfile').join('\n')
const viteKeys = [...exampleKeys].filter((k) => k.startsWith('VITE_'))

for (const key of viteKeys) {
	if (!dockerfileContent.includes(`ARG ${key}`)) {
		note(`${key} not found as ARG in Dockerfile`)
	}
	if (!dockerfileContent.includes(`ENV ${key}`)) {
		note(`${key} not found as ENV in Dockerfile`)
	}
}

// ─── 3. Check docker-compose.yml has VITE_ keys in build args ───────
// console.log('Checking docker-compose.yml for VITE_ build args...')

const composeContent = readLines('docker-compose.yml').join('\n')

for (const key of viteKeys) {
	if (!composeContent.includes(key)) {
		note(`${key} not found in docker-compose.yml`)
	}
}

// ─── 4. Check docker-compose.yml has server env vars ────────────────
// console.log('Checking docker-compose.yml for server env vars...')

const serverKeys = [...exampleKeys].filter(
	(k) => !k.startsWith('VITE_') && k !== 'PROD_DATABASE_URL',
)

for (const key of serverKeys) {
	if (!composeContent.includes(key)) {
		note(`${key} not found in docker-compose.yml environment section`)
	}
}

// ─── Result ──────────────────────────────────────────────────────────
if (hasIssues) {
	logger.error('Some env sync issues found above. Review and fix if needed.')
	process.exit(1)
} else {
	logger.info('All env files are in sync')
}

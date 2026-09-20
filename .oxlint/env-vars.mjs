import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const sourceExtensions = new Set(['.js', '.jsx', '.mjs', '.ts', '.tsx']);
const ignoredDirectories = new Set(['.output', 'node_modules']);
const standardVariables = new Set(['NODE_ENV']);

function read(root, path) {
  return readFileSync(resolve(root, path), 'utf8');
}

/** Returns source files below a directory without inspecting generated output or dependencies. */
function listSourceFiles(directory) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;

    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(path));
    } else if (sourceExtensions.has(extname(entry.name))) {
      files.push(path);
    }
  }

  return files;
}

function collectMatches(contents, pattern) {
  return new Set(Array.from(contents.matchAll(pattern), (match) => match[1] ?? match[2]));
}

function collectAccessedVariables(files, pattern) {
  const variables = new Set();

  for (const file of files) {
    for (const variable of collectMatches(readFileSync(file, 'utf8'), pattern)) {
      variables.add(variable);
    }
  }

  return variables;
}

function collectDeclaredVariables(contents, interfaceName) {
  const interfaceBody = contents.match(
    new RegExp(`interface ${interfaceName} \\{(?<body>[\\s\\S]*?)\\n  \\}`),
  )?.groups?.body;

  return interfaceBody
    ? collectMatches(interfaceBody, /^\s*readonly\s+([A-Z][A-Z0-9_]*)\??:/gm)
    : new Set();
}

function collectServerVariables(contents) {
  const schemaBody = contents.match(/const serverEnvType = type\(\{(?<body>[\s\S]*?)\n\}\)\.pipe/)
    ?.groups?.body;

  return schemaBody
    ? collectMatches(schemaBody, /^\s*['"]?([A-Z][A-Z0-9_]*)\??['"]?\s*:/gm)
    : new Set();
}

function isMentioned(contents, variable) {
  return new RegExp(`(^|[^A-Z0-9_])${variable}([^A-Z0-9_]|$)`, 'm').test(contents);
}

function requireMentions(errors, variables, surfaces) {
  for (const variable of variables) {
    for (const [path, contents] of surfaces) {
      if (!isMentioned(contents, variable)) {
        errors.push(`${variable} is missing from ${path}`);
      }
    }
  }
}

/** Checks each environment context against the files that deliver and type its variables. */
function findEnvironmentErrors(root) {
  const envExample = read(root, '.env.example');
  const envTypes = read(root, 'apps/web/src/env.d.ts');
  const serverEnv = read(root, 'apps/web/src/server/env.server.ts');
  const webDockerfile = read(root, 'apps/web/Dockerfile');
  const compose = read(root, 'compose.yaml');
  const errors = [];

  const clientVariables = collectDeclaredVariables(envTypes, 'ImportMetaEnv');
  const nodeVariables = collectDeclaredVariables(envTypes, 'ProcessEnv');
  const serverVariables = collectServerVariables(serverEnv);
  const workerVariables = collectAccessedVariables(
    listSourceFiles(resolve(root, 'apps/worker')),
    /process\.env(?:\.([A-Z][A-Z0-9_]*)|\[['"]([A-Z][A-Z0-9_]*)['"]\])/g,
  );
  const databaseVariables = collectAccessedVariables(
    listSourceFiles(resolve(root, 'packages/db')),
    /process\.env(?:\.([A-Z][A-Z0-9_]*)|\[['"]([A-Z][A-Z0-9_]*)['"]\])/g,
  );

  requireMentions(errors, clientVariables, [
    ['.env.example', envExample],
    ['apps/web/Dockerfile', webDockerfile],
    [
      'compose.yaml web build args',
      compose.match(/web:[\s\S]*?build:[\s\S]*?environment:/)?.[0] ?? '',
    ],
  ]);

  requireMentions(errors, serverVariables, [
    ['apps/web/src/env.d.ts ProcessEnv', [...nodeVariables].join('\n')],
    [
      'compose.yaml web environment',
      compose.match(/web:[\s\S]*?environment:[\s\S]*?networks:/)?.[0] ?? '',
    ],
  ]);
  requireMentions(
    errors,
    new Set([...serverVariables].filter((variable) => !standardVariables.has(variable))),
    [['.env.example', envExample]],
  );

  requireMentions(errors, workerVariables, [
    ['.env.example', envExample],
    [
      'compose.yaml worker environment',
      compose.match(/worker:[\s\S]*?environment:[\s\S]*?networks:/)?.[0] ?? '',
    ],
  ]);

  requireMentions(
    errors,
    new Set([...databaseVariables].filter((variable) => !standardVariables.has(variable))),
    [['.env.example', envExample]],
  );

  return errors;
}

const environmentRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require environment variables in every file that types and delivers them.',
    },
  },
  create(context) {
    const target = 'apps/web/src/env.d.ts';
    if (relative(context.cwd, context.filename) !== target) return {};

    return {
      Program(node) {
        for (const message of findEnvironmentErrors(context.cwd)) {
          context.report({ node, message });
        }
      },
    };
  },
};

export default {
  meta: { name: 'veles', version: '1.0.0' },
  rules: { 'env-vars': environmentRule },
};

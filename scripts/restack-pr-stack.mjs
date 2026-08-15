#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const branches = process.argv.slice(2);

if (branches.length < 2) {
  throw new Error('Usage: node scripts/restack-pr-stack.mjs <branches-in-order...>');
}

/** Runs Git with inherited output and stops without hiding conflict state. */
function git(args, options = {}) {
  const result = spawnSync('git', args, {
    env: { ...process.env, GIT_EDITOR: 'true' },
    stdio: 'inherit',
    ...options,
  });

  if (result.error) throw result.error;
  return result.status ?? 1;
}

const gitPath = (name) => {
  const result = spawnSync('git', ['rev-parse', '--git-path', name], { encoding: 'utf8' });
  if (result.status !== 0) process.exit(result.status ?? 1);
  return result.stdout.trim();
};

const rebaseInProgress = () =>
  existsSync(gitPath('rebase-merge')) || existsSync(gitPath('rebase-apply'));

if (rebaseInProgress() && git(['rebase', '--continue']) !== 0) {
  console.error('Resolve and stage the conflict, then rerun this command.');
  process.exit(1);
}

for (let index = 1; index < branches.length; index += 1) {
  if (git(['switch', branches[index]]) !== 0) process.exit(1);

  if (git(['rebase', branches[index - 1]]) !== 0) {
    console.error('Resolve and stage the conflict, then rerun this command.');
    process.exit(1);
  }
}

if (git(['push', '--force-with-lease', 'origin', ...branches]) !== 0) process.exit(1);

// Refreshes the shipped catalog (ADR-0045): Open Food Facts every time, the shop websites with
// --shops (slow: about two hours for Aldi). Raw data goes to a temporary folder, never into git.
//
//   NODE_USE_ENV_PROXY=1 node scripts/catalog/refresh.mjs [--shops]
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const raw = mkdtempSync(join(tmpdir(), 'rettich-catalog-'));
const run = (script, ...args) =>
  execFileSync(process.execPath, [`scripts/catalog/${script}`, ...args], { stdio: 'inherit' });

run('off-stores.mjs', join(raw, 'off.jsonl'));
if (process.argv.includes('--shops')) {
  run('crawl-aldi.mjs', join(raw, 'aldi.jsonl'));
}
run(
  'build.mjs',
  join(raw, 'off.jsonl'),
  process.argv.includes('--shops') ? join(raw, 'aldi.jsonl') : '-',
);

// Build command of Cloudflare Workers Builds (docs/previews.md, wrangler.jsonc).
//
// - Branch main (WORKERS_CI_BRANCH, set by Workers Builds): the real app for the pilot,
//   without demo data and styleguide.
// - Every other branch (the preview links of pull requests): demo mode with «Beispieldaten
//   laden» and /styleguide, so Alban can try each change at once.
import { execSync } from 'node:child_process';

const production = process.env.WORKERS_CI_BRANCH === 'main';
const script = production ? 'build' : 'build:demo';
process.stdout.write(`Cloudflare build: ${production ? 'production (main)' : 'demo preview'}\n`);
execSync(`pnpm --filter @fridgeai/web ${script}`, { stdio: 'inherit' });

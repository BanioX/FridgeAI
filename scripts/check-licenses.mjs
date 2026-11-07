// Fails when a dependency's licence could limit commercial use of FridgeAI (ADR-0015).
// Runtime code (shipped to users) must be permissive; tooling may use weak copyleft
// (e.g. MPL-2.0 in build tools) but never strong copyleft such as GPL or AGPL.
import { execSync } from 'node:child_process';

const PERMISSIVE = new Set([
  'MIT',
  'Apache-2.0',
  'ISC',
  'BSD-2-Clause',
  'BSD-3-Clause',
  '0BSD',
  'BlueOak-1.0.0',
  'CC0-1.0',
  'Unlicense',
  'Zlib',
  'OFL-1.1',
]);
const STRONG_COPYLEFT = /\b(A?GPL|LGPL|SSPL|EUPL|OSL|CPAL)\b/i;

/**
 * SPDX expressions: «(MIT OR CC0-1.0)» lets us pick one, so one permissive choice is enough;
 * «(MIT AND Zlib)» means all of them apply.
 */
function permissive(expression) {
  const inner = expression.replace(/^\((.*)\)$/, '$1').trim();
  if (inner.includes(' OR ')) {
    return inner.split(' OR ').some((part) => permissive(part.trim()));
  }
  if (inner.includes(' AND ')) {
    return inner.split(' AND ').every((part) => permissive(part.trim()));
  }
  return PERMISSIVE.has(inner);
}

/** `pnpm licenses list --json`: { "<licence>": [{ name, versions, … }] } */
function licenses(production) {
  const output = execSync(`pnpm licenses list --json${production ? ' --prod' : ''}`, {
    encoding: 'utf8',
  });
  return Object.entries(JSON.parse(output));
}

const names = (packages) => packages.map((item) => item.name).join(', ');
const problems = [];

for (const [licence, packages] of licenses(true)) {
  if (!permissive(licence)) {
    problems.push(`runtime  ${licence}: ${names(packages)}`);
  }
}
for (const [licence, packages] of licenses(false)) {
  if (STRONG_COPYLEFT.test(licence) && !permissive(licence)) {
    problems.push(`tooling  ${licence}: ${names(packages)}`);
  }
}

if (problems.length > 0) {
  console.error(`Licences that could limit commercial use (ADR-0015):\n${problems.join('\n')}`);
  process.exit(1);
}
process.stdout.write('Licences OK: runtime permissive, no strong copyleft anywhere.\n');

// Prepares a release (ADR-0017): next version from the Conventional Commits on main since the last
// tag, a German section on top of CHANGELOG.md and the version in package.json.
//
//   pnpm release            write CHANGELOG.md and package.json
//   pnpm release --dry-run  only print what would change
//   pnpm release --count    how many changes since the last release (for the 10-PR rule)
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const REPO = 'https://github.com/BanioX/FridgeAI';
const SECTIONS = [
  ['feat', 'Neu'],
  ['fix', 'Behoben'],
  ['perf', 'Schneller'],
  ['docs', 'Dokumentation'],
  ['test', 'Tests'],
  ['refactor', 'Wartung'],
  ['chore', 'Wartung'],
  ['ci', 'Wartung'],
  ['build', 'Wartung'],
];

const git = (args) =>
  execSync(`git ${args}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

function lastTag() {
  try {
    return git('describe --tags --abbrev=0 --match "v[0-9]*"');
  } catch {
    return null;
  }
}

const tag = lastTag();
const subjects = git(`log ${tag === null ? 'HEAD' : `${tag}..HEAD`} --format=%s`)
  .split('\n')
  .filter((subject) => subject !== '' && !subject.startsWith('chore(release)'));

if (process.argv.includes('--count')) {
  process.stdout.write(`${String(subjects.length)} changes since ${tag ?? 'the start'}\n`);
  process.exit(0);
}
if (subjects.length === 0) {
  process.stdout.write('Nothing to release.\n');
  process.exit(0);
}

const parsed = subjects.map((subject) => {
  const match = /^(\w+)(?:\([^)]*\))?(!)?: (.+)$/.exec(subject);
  return match === null
    ? { type: 'chore', breaking: false, text: subject }
    : { type: match[1], breaking: match[2] === '!', text: match[3] };
});

// Semantic versioning; while in 0.x a breaking change or a feature raises the minor version.
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const [major, minor, patch] = (packageJson.version ?? '0.0.0').split('.').map(Number);
const raiseMinor = parsed.some((change) => change.breaking || change.type === 'feat');
const next =
  major === 0 || !parsed.some((change) => change.breaking)
    ? raiseMinor
      ? `${String(major)}.${String(minor + 1)}.0`
      : `${String(major)}.${String(minor)}.${String(patch + 1)}`
    : `${String(major + 1)}.0.0`;

const linked = (text) => text.replace(/\(#(\d+)\)$/, `([#$1](${REPO}/pull/$1))`);
const today = new Date().toISOString().slice(0, 10);
const groups = new Map();
for (const change of parsed) {
  const title = SECTIONS.find(([type]) => type === change.type)?.[1] ?? 'Wartung';
  groups.set(title, [...(groups.get(title) ?? []), `- ${linked(change.text)}`]);
}
const order = [...new Set(SECTIONS.map(([, title]) => title))];
const section = [
  `## [${next}] – ${today}`,
  '',
  ...order
    .filter((title) => groups.has(title))
    .flatMap((title) => [`### ${title}`, '', ...groups.get(title), '']),
].join('\n');

const header =
  '# Changelog\n\nAlle Änderungen an Rettich (bis 7.11.2026 FridgeAI), neueste zuerst. Wird mit `pnpm release` erzeugt (ADR-0017).\n\n';
const previous = existsSync('CHANGELOG.md')
  ? readFileSync('CHANGELOG.md', 'utf8').replace(/^# Changelog\n[\s\S]*?(?=^## \[)/m, '')
  : '';

if (process.argv.includes('--dry-run')) {
  process.stdout.write(`${section}\n`);
  process.exit(0);
}
writeFileSync('CHANGELOG.md', `${header}${section}\n${previous}`);
writeFileSync('package.json', `${JSON.stringify({ ...packageJson, version: next }, null, 2)}\n`);
process.stdout.write(`v${next}: ${String(subjects.length)} changes → CHANGELOG.md, package.json\n`);

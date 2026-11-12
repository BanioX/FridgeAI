// Prepares a release (ADR-0017): next version from the Conventional Commits on main since the last
// release, a German section on top of CHANGELOG.md and the version in package.json.
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

/** Subjects of release commits: «chore(release): v0.11.0 (#214)», «chore: release 0.16.0 (#278)». */
const RELEASE = '^chore(\\(release\\))?: (release )?v?[0-9]+\\.[0-9]+\\.[0-9]+';

/**
 * The last release on this branch, found by its commit. Tags are not asked: since the history was
 * rewritten (ADR-0065) the older ones no longer point into main, and `git describe` finds none.
 */
function lastRelease() {
  const found = git(`log -1 --format=%H%x09%s -E --grep="${RELEASE}"`);
  if (found === '') {
    return null;
  }
  const [commit = '', subject = ''] = found.split('\t');
  return { commit, name: `v${/(\d+\.\d+\.\d+)/.exec(subject)?.[1] ?? commit.slice(0, 7)}` };
}

const last = lastRelease();
const subjects = git(`log ${last === null ? 'HEAD' : `${last.commit}..HEAD`} --format=%s`)
  .split('\n')
  .filter((subject) => subject !== '' && !new RegExp(RELEASE).test(subject));

if (process.argv.includes('--count')) {
  process.stdout.write(`${String(subjects.length)} changes since ${last?.name ?? 'the start'}\n`);
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

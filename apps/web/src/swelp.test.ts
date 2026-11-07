import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * «Tut» from SWELP (docs/swelp/README.md): every side effect of the app stands in
 * docs/swelp/nebenwirkungen.md. New network hosts or storage keys break this test until the
 * register (and, for data leaving the device, Alban's decision) is there.
 */
const root = resolve(import.meta.dirname, '..', '..', '..');
const register = readFileSync(join(root, 'docs', 'swelp', 'nebenwirkungen.md'), 'utf8');

/** Values in backticks in the given column of the table under a heading. */
function column(heading: string, name: string): string[] {
  const section = register.split(/^## /m).find((part) => part.startsWith(heading)) ?? '';
  const rows = section.split('\n').filter((line) => line.startsWith('|'));
  const header = (rows[0] ?? '').split('|').map((cell) => cell.trim());
  const index = header.indexOf(name);
  return rows
    .slice(2)
    .map((row) => row.split('|')[index] ?? '')
    .flatMap((cell) => [...cell.matchAll(/`([^`]+)`/g)].map((match) => match[1] ?? ''));
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      return sourceFiles(path);
    }
    return /\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [path] : [];
  });
}

describe('SWELP side effects register', () => {
  it('lists exactly the hosts the content security policy lets the app talk to', () => {
    const headers = readFileSync(join(root, 'apps', 'web', 'public', '_headers'), 'utf8');
    const connect = /connect-src ([^;]+)/.exec(headers)?.[1] ?? '';
    const hosts = connect
      .split(/\s+/)
      .filter((source) => source.startsWith('https://'))
      .map((source) => new URL(source).host)
      .sort();
    const listed = column('Netz', 'Host')
      .filter((host) => host.includes('.'))
      .sort();
    expect(listed).toEqual(hosts);
  });

  it('lists every key the app keeps in local or session storage', () => {
    const keys = new Set(
      sourceFiles(join(root, 'apps', 'web', 'src')).flatMap((file) =>
        [...readFileSync(file, 'utf8').matchAll(/['"](fridgeai:[a-z-]+)['"]/g)].map(
          (match) => match[1] ?? '',
        ),
      ),
    );
    const listed = new Set(column('Gerätespeicher', 'Schlüssel'));
    for (const key of keys) {
      expect(listed, `${key} fehlt in docs/swelp/nebenwirkungen.md`).toContain(key);
    }
  });
});

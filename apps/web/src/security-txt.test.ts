import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const web = (path: string) => resolve(import.meta.dirname, '..', path);
const file = readFileSync(web('public/.well-known/security.txt'), 'utf8');
const field = (name: string) => new RegExp(`^${name}: (.+)$`, 'm').exec(file)?.[1];

describe('security.txt (RFC 9116)', () => {
  it('names a contact', () => {
    expect(field('Contact')).toMatch(/^https:\/\/github\.com\/BanioX\/FridgeAI\/security\//);
  });

  it('expires in the future (renew it before that day)', () => {
    const expires = field('Expires');
    expect(expires).toBeDefined();
    expect(new Date(expires ?? '').getTime()).toBeGreaterThan(Date.now());
  });

  it('has no Canonical line: the address of the app stays out of the repo (ADR-0049)', () => {
    expect(file).not.toMatch(/^Canonical:/m);
    expect(file).not.toMatch(/https?:\/\/(?!github\.com\/)/);
  });

  it('is served as text and kept away from the service worker fallback', () => {
    const headers = readFileSync(web('public/_headers'), 'utf8');
    expect(headers).toMatch(/\/\.well-known\/security\.txt\n\s+Content-Type: text\/plain/);
    const config = readFileSync(web('vite.config.ts'), 'utf8');
    expect(config).toContain('navigateFallbackDenylist: [/^\\/\\.well-known\\//]');
  });
});

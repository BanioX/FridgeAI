import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

interface HeaderRule {
  pattern: RegExp;
  headers: [name: string, value: string][];
}

const escapeRegExp = (text: string) => text.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

/**
 * Parses a Cloudflare `_headers` file: an unindented line is a path pattern (`*` matches
 * anything), the indented `Name: value` lines below it are its headers. Comments start with `#`.
 */
export function parseHeadersFile(text: string): HeaderRule[] {
  const rules: HeaderRule[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }
    if (!/^\s/.test(line)) {
      const source = trimmed.split('*').map(escapeRegExp).join('.*');
      rules.push({ pattern: new RegExp(`^${source}$`), headers: [] });
      continue;
    }
    const rule = rules.at(-1);
    const separator = trimmed.indexOf(':');
    if (rule === undefined || separator <= 0) {
      throw new Error(`Invalid _headers line: ${line}`);
    }
    rule.headers.push([trimmed.slice(0, separator).trim(), trimmed.slice(separator + 1).trim()]);
  }
  return rules;
}

/** Applies `public/_headers` in `vite preview`, so local and E2E runs match Cloudflare. */
export function staticHeaders(file: URL): Plugin {
  return {
    name: 'fridgeai:static-headers',
    configurePreviewServer(server) {
      const rules = parseHeadersFile(readFileSync(file, 'utf8'));
      server.middlewares.use((req, res, next) => {
        const path = new URL(req.url ?? '/', 'http://localhost').pathname;
        for (const rule of rules.filter(({ pattern }) => pattern.test(path))) {
          for (const [name, value] of rule.headers) {
            res.setHeader(name, value);
          }
        }
        next();
      });
    },
  };
}

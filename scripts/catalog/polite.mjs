// Shared rules for collecting public product data (ADR-0045): an honest name, robots.txt,
// a pause between requests and no way around a block. A 403 or 429 stops the run.
export const USER_AGENT = 'RettichBot/0.1 (+https://github.com/BanioX/Rettich)';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class Blocked extends Error {}

export async function fetchText(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': USER_AGENT, 'accept-language': 'de-CH' },
  });
  if (response.status === 403 || response.status === 429) {
    throw new Blocked(`${String(response.status)} for ${url}: stop, do not work around it`);
  }
  if (!response.ok) {
    throw new Error(`${String(response.status)} for ${url}`);
  }
  return response.text();
}

/** The Disallow rules for all agents, as path prefixes with «*» wildcards. */
export async function robotsRules(origin) {
  const text = await fetchText(`${origin}/robots.txt`);
  const rules = [];
  let applies = false;
  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*/, '').trim();
    const [key, ...rest] = line.split(':');
    const value = rest.join(':').trim();
    if (/^user-agent$/i.test(key ?? '')) {
      applies = value === '*' || /rettichbot/i.test(value);
    } else if (applies && /^disallow$/i.test(key ?? '') && value !== '') {
      const pattern = value.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      rules.push(new RegExp(`^${pattern.startsWith('/') ? pattern : `.*${pattern}`}`));
    }
  }
  return (url) => {
    const { pathname, search } = new URL(url);
    return !rules.some((rule) => rule.test(pathname + search));
  };
}

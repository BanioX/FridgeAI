/**
 * Developer tools (demo data at /dev/seed, style guide at /styleguide): on in `vite dev` and in demo
 * builds (`vite build --mode demo`, used for the Cloudflare previews, ADR-0013). Both values are
 * replaced at build time. routes.tsx repeats this condition inline, because the bundler only drops
 * the lazy route chunks from production builds for a literal condition; CI checks that it does.
 */
export const DEV_TOOLS = import.meta.env.DEV || import.meta.env.MODE === 'demo';

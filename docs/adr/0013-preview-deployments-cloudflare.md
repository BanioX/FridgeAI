# ADR-0013: Vorschau-Deployments auf Cloudflare Workers

- **Status:** angenommen
- **Datum:** 2026-11-06

## Kontext

Alban arbeitet am Handy und will jede Änderung schnell sehen («Anpassungen schnell anzeigbar und umsetzbar»). Bisher gab es nur Screenshots (`pnpm preview:shots`). Er hat Cloudflare, Oracle Cloud, Tailscale und Docker zur Verfügung. Die App ist bis zum Backend (Schritt 7) eine rein statische PWA ohne Server.

## Entscheid

- **Cloudflare Workers mit Static Assets und Workers Builds** (Git-Anbindung im Dashboard). Push auf `main` → Produktion unter `fridgeai.<konto>.workers.dev`. Jeder andere Branch → eigene **Worker Preview** mit festem Link, den Cloudflare als Kommentar in den PR schreibt.
- Nicht Cloudflare Pages: Pages läuft weiter, aber neue Funktionen (Worker Previews, schnelle PR-Kommentare) kommen bei Workers. Die spätere API (Hono, ADR-0009) kann im selben Worker laufen.
- Nicht GitHub Actions mit API-Token: Das bräuchte ein Cloudflare-Token als GitHub-Secret. Workers Builds verwaltet sein Token selbst, im Repo liegt nichts Geheimes.
- **Konfiguration im Repo:** `wrangler.jsonc` (nur Assets, SPA-Fallback, leerer `previews`-Block), `apps/web/public/_headers` (CSP, Sicherheits-Header, Caching), Build-Befehl `pnpm build:cf`. Einrichtung im Dashboard: [`docs/previews.md`](../previews.md).
- **Demo-Modus:** `pnpm build:cf` baut mit `vite build --mode demo`. Damit sind `/dev/seed` («Beispieldaten laden») und `/styleguide` auch in Vorschauen verfügbar. Der normale `pnpm build` enthält sie nicht; CI und E2E prüfen das.
- **Gleiche Header lokal:** `vite preview` wendet `_headers` ebenfalls an (`scripts/static-headers.ts`). Die E2E-Tests laufen dadurch mit der echten CSP und schlagen bei jeder Verletzung fehl.
- **Wrangler ist keine Dependency.** Cloudflare holt es per `npx` im Build (das grosse `workerd`-Binary bliebe sonst in jeder CI-Installation). Bricht eine neue Wrangler-Version den Build, pinnen wir sie im Deploy-Befehl.

## Konsequenzen

- Kostenlos im Free-Plan (3000 Build-Minuten pro Monat, statische Aufrufe unbegrenzt). Es entstehen keine Kosten für Alban.
- Vorschau-Links sind öffentlich, enthalten aber keine echten Daten: Alles bleibt lokal im Browser (ADR-0003). Optional später Cloudflare Access.
- Die CSP erlaubt nur eigene Quellen (`'self'`). Wer später externe Dienste anbindet (z. B. Open Food Facts, Backend auf eigener Domain), passt `connect-src` in `_headers` an. Der E2E-Test zeigt sofort, wenn etwas blockiert wird.
- Bis zum Release (Schritt 12) ist auch `main` ein Demo-Build. Für den Release wechselt der Build-Befehl der Produktion auf `pnpm build`, Vorschauen bleiben im Demo-Modus.
- Der Server für Sync, Login und Push (Schritt 7) läuft wie in ADR-0009 auf Oracle Cloud mit Docker. Die PWA kann bei Cloudflare bleiben.

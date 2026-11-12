# ADR-0009: Backend-Stack und Betrieb (nach dem Muster von HUB-042)

- **Status:** angenommen (Alban hat Cloudflare, Oracle Cloud, Tailscale und Docker zur Verfügung, 6.11.2026; Plan Frage 1)
- **Datum:** 2026-11-06

## Kontext

Ab Schritt 7 braucht FridgeAI einen Server: Haushalt teilen, Sync, Push, später API und MCP. Alban: «Brauche Cloudflare oder Docker zum Testnutzer laufen lassen; orientiere dich an HUB-042.» HUB-042 läuft mit Docker Compose (Node 24, Express, PostgreSQL 16), GitHub Actions → GHCR → Watchtower und Cloudflare Tunnel, gratis auf Oracle Cloud Always Free (Region Zürich).

## Entscheid

- **API:** Node.js 24 + **Hono** in TypeScript (`apps/api`). Gleiche Sprache wie App und Kern, Zod-Schemas aus `@fridgeai/core` direkt als Validierung und OpenAPI. Hono läuft auf Node in Docker und später unverändert auf Edge-Plattformen (z. B. Cloudflare Workers).
- **Datenbank:** PostgreSQL (aktuelle Hauptversion beim Aufsetzen prüfen), Migrationen mit Drizzle im Repo, Row-Level-Security pro Haushalt.
- **Login:** Magic Link per E-Mail (SMTP wie HUB-042), Sessions per Cookie; Passkeys und OAuth (Partner, MCP) folgen.
- **Betrieb wie HUB-042:** `docker-compose.yml` mit `db`, `api` (liefert auch die PWA aus), `tunnel` (Cloudflare) und automatischen Updates; Images auf GHCR, Deploy nach Merge auf `main`.
- **Lokal und Testnutzer:** `docker compose up db api` plus Seed-Skript für Test-Haushalte; CI startet eine Wegwerf-Datenbank für Integrationstests.
- **Pilot-Hosting:** Oracle Cloud Always Free, Region Zürich, oder Albans bestehender Server; stabile Adresse über eine eigene Domain mit Cloudflare Named Tunnel.

## Konsequenzen

- Gleicher Betrieb auf Laptop, CI und Server; Alban kennt ihn bereits.
- Skalierung gemäss `docs/architecture.md`: zustandslose API-Container, verwaltetes Postgres, später Aufteilen nach `householdId`.
- Die PWA und die Vorschau-Links laufen schon vorher auf Cloudflare (ADR-0013); der Server kommt mit Schritt 7 dazu.
- Domain: kauft Alban nach dem Pilot, wenn der Prototyp überzeugt. Bis dahin laufen App und Pilot kostenlos über `workers.dev`, Tailscale Funnel oder einen Cloudflare Quick Tunnel.

# rettich 🥬

[![CI](https://github.com/BanioX/FridgeAI/actions/workflows/ci.yml/badge.svg)](https://github.com/BanioX/FridgeAI/actions/workflows/ci.yml)

Bis 7.11.2026 hiess die App «FridgeAI». Repo, Paketnamen und Web-Adresse heissen technisch weiter so ([ADR-0032](docs/adr/0032-name-rettich.md)).

**Wirf kein Geld in den Kübel.** rettich, klein geschrieben, wie «rett' ich».

> **Scan deinen Bon – rettich weiss, was du hast, wem es gehört, wer was schuldet und was du heute retten musst.**

Local-first PWA für Schweizer Haushalte (WGs, Paare, Familien) gegen Food Waste. Alles funktioniert offline auf dem Gerät; KI-Erkennung läuft über die KI, die du ohnehin nutzt (ChatGPT, Claude, Gemini), ohne Kosten für rettich.

**Product Owner:** Alban Hyseni · **Status:** bereit für den Pilot ([`docs/pilot.md`](docs/pilot.md)); Bon-Scan und Teilen im Haushalt folgen · **Lizenz:** proprietär, alle Rechte vorbehalten

---

## Inhalt

- [Was die App heute kann](#was-die-app-heute-kann)
- [Am Handy ausprobieren](#am-handy-ausprobieren)
- [Am Rechner entwickeln](#am-rechner-entwickeln)
- [Architektur](#architektur)
- [Projektstruktur](#projektstruktur)
- [Arbeitsweise](#arbeitsweise)
- [Datenschutz und Sicherheit](#datenschutz-und-sicherheit)
- [Dokumentation](#dokumentation)
- [Lizenz](#lizenz)

## Was die App heute kann

Unten fünf Tabs: **Start · Vorrat · ＋ Erfassen · Kochen · Mehr** ([ADR-0031](docs/adr/0031-tab-navigation.md)). Hinter ＋ liegen alle Wege in den Vorrat, unter «Kochen» Rezepte, die retten, was bald abläuft, unter «Mehr» Berichte, Nachkaufen und deine Daten.

| Bereich | Funktion |
| --- | --- |
| **Start** | Was bald abläuft, Wert im Kühlschrank in CHF, Lagerorte auf einen Blick |
| **Vorrat** | Kühlschrank, Tiefkühler, Vorrat, Notvorrat (bis 100 Jahre) |
| **Erfassen** | Name genügt: Kategorie, Lagerort, Menge, Verpackung und Ablaufdatum werden vorgeschlagen; Eier im 6er/10er, Datumsfeld mit Schnellwahl und Eintippen; «Schnell erfassen»: die eigenen Standardartikel mit einem Tipp; Suche beim Tippen wie «Coop Weggli» (eigene Produkte und Open Food Facts Schweiz) |
| **Bon hochladen** | PDF, Screenshot oder Foto des Kassenbons (Coop, Migros, Aldi, Lidl, Denner) auf dem Gerät auslesen: Produktname, Menge, bezahlter Preis mit Aktion, Summenprüfung; Lebensmittel angehakt, mit Preis in den Vorrat; derselbe Bon nie doppelt |
| **Berichte als PDF** | Unter «Mehr»: «Kühlschrank jetzt», «Deine Wirkung» (gerettet und weggeworfen pro Monat, Gründe, «Was auffällt» mit Tipps), «Einkäufe» nach Laden oder alles zusammen, für diesen Monat, 3 Monate oder das Jahr; auf dem Gerät erzeugt und in der App geöffnet, von dort teilen oder speichern |
| **Barcode und eigene KI** | Unter ＋: Barcode, QR und GS1-DataMatrix (Datum aus dem Code); KI-Import: Foto in deiner KI, Liste in rettich übernehmen |
| **Abschliessen** | Gegessen, weitergegeben (an wen), weggeworfen (warum) – ganz oder in sinnvollen Portionen (⅛ Kuchen, ⅓ Käse, 2 von 4 Joghurts) |
| **Öffnungsregel** | «Nach dem Öffnen innert 21 Tagen» verkürzt das Datum automatisch |
| **Einfrieren** | Umlagern mit neu geschätztem Datum |
| **Kühlschrank-Check** | Einmal pro Woche jeden Artikel kurz bestätigen: noch da, halb, gegessen oder weggeworfen |
| **Korrigieren** | Rückgängig nach Gegessen/Weggeworfen, dazu «Nachkaufen» mit einem Tipp; Name, Kategorie, Ort, Datum, Menge und Preis ändern; Artikel löschen |
| **Produktdaten** | Nach dem Scan: Bild, Marke, Nährwerte, Nutri-Score, Allergene (Open Food Facts, 30 Tage offline) |
| **Kochen** | Bis zu zehn Rezepte, die retten, was bald abläuft (drei davon auf «Start»); alle Rezepte, zuerst was mit deinem Vorrat geht, Filter Schnell, Vegetarisch, Vegan, Eiweissreich; was fehlt, mit einem Tipp zu «Nachkaufen»; nach dem Kochen abbuchen |
| **Nachkaufen** | Unter «Mehr»: «Du hast noch …» gegen Doppelkäufe, abhaken, «In den Vorrat legen» |
| **Wirkung** | Gerettet (kurz vor Ablauf gegessen oder weitergegeben) und weggeworfen diesen Monat in CHF und Artikeln, «x % gerettet von allem, was knapp wurde» ([ADR-0033](docs/adr/0033-rescued-means-at-risk.md)) |
| **Mehr** | Berichte, Nachkaufen, App installieren; Daten exportieren (JSON/CSV), wieder importieren oder löschen, Datenschutz in Kürze |

Geplant: Teilen in WG und Familie, Kosten aufteilen, Push-Erinnerungen, Wirkungs-Dashboard, MCP-Connector für ChatGPT/Claude, Büro-Kühlschrank. Reihenfolge: [`docs/plan.md`](docs/plan.md).

## Am Handy ausprobieren

Jeder Pull Request bekommt automatisch einen eigenen **Vorschau-Link** (Cloudflare schreibt ihn als Kommentar in den PR). `main` läuft unter der festen Produktionsadresse. Einrichtung und Tipps: [`docs/previews.md`](docs/previews.md).

1. Link öffnen (iPhone: Teilen → «Zum Home-Bildschirm» für App-Gefühl).
2. **«Beispieldaten laden»** auf der Startseite tippen – ein typischer WG-Kühlschrank erscheint.
3. Auf einen Artikel tippen, erfassen, scannen, ausprobieren. Daten bleiben nur auf deinem Gerät.

## Am Rechner entwickeln

Voraussetzungen: **Node 24** und **pnpm 10** (Version kommt über `packageManager` und Corepack).

```bash
corepack enable
pnpm install
pnpm dev            # = pnpm --filter @fridgeai/web dev → http://localhost:5173
```

| Befehl | Zweck |
| --- | --- |
| `pnpm format` / `pnpm format:check` | Prettier |
| `pnpm lint` | ESLint (typgeprüft, keine Warnungen erlaubt) |
| `pnpm typecheck` | TypeScript strict, inkl. Reinheits-Check von `packages/core` |
| `pnpm test` / `pnpm test:coverage` | Vitest (Kern ≥ 90 % Zeilen) |
| `pnpm build` | Produktions-Build der PWA |
| `pnpm build:cf` | Build für Cloudflare-Vorschauen (Demo-Modus mit Beispieldaten und Styleguide) |
| `pnpm e2e` | Playwright inkl. Barrierefreiheit (axe) und Sicherheits-Header |
| `pnpm preview:shots / /inventory …` | iPhone-Screenshots einzelner Seiten nach `apps/web/.previews/` |
| `pnpm licenses:check` | Prüft, dass keine Lizenz die kommerzielle Nutzung einschränkt |

Vor jedem Push: alles grün (`format:check`, `lint`, `typecheck`, `test`, `build`, `e2e`). Lokal ohne installiertes Chromium: `PW_CHROMIUM_EXECUTABLE=/pfad/zu/chromium pnpm e2e`.

## Architektur

```mermaid
flowchart LR
  subgraph Gerät
    UI["PWA (React 19, Vite, Tailwind)"] -->|nur Commands und Queries| Contract["Schnittstelle v1 (Zod)"]
    Contract --> Handlers["Lokale Handler"]
    Handlers --> DB[("IndexedDB (Dexie)")]
    Handlers --> Core["@fridgeai/core (reines TypeScript)"]
    UI --> Scanner["Scanner (ZXing WebAssembly)"]
  end
  KI["Deine KI (ChatGPT, Claude, Gemini)"] -. "Antwort einfügen" .-> UI
  Contract -. später .-> API["REST-API und MCP-Server"]
  API -. später .-> Server[("Hono + PostgreSQL (Docker, Oracle Cloud)")]
```

- **Local-first:** Alles funktioniert ohne Konto und offline; Sync folgt mit dem Backend ([ADR-0003](docs/adr/0003-local-first-and-ids.md), [ADR-0009](docs/adr/0009-backend-stack.md)).
- **Contract-first:** Die UI ruft nur Operationen der Schnittstelle auf; dieselben Zod-Schemas werden später zu REST-API und MCP-Werkzeugen ([ADR-0005](docs/adr/0005-contract-first-api-mcp.md)).
- **Reiner Kern:** `packages/core` kennt kein DOM, kein IndexedDB und kein `fetch`; Äusseres nur über Ports.
- **Geld in Rappen** (Integer), Ablaufdaten als Kalendertag in Europe/Zurich, IDs als UUIDv7.

## Projektstruktur

```
apps/web/            PWA: Seiten (features/), Design-System (ui/), Datenhaltung (data/), E2E-Tests (e2e/)
packages/core/       Domäne: Modell, Schnittstelle, Kategorien, Daten, Mengen, Ablauf, GS1, KI-Import
docs/                Plan, Use Cases, Architektur, Design, Strategie, Entscheide (adr/)
scripts/             Hilfsskripte (z. B. Lizenzprüfung)
.github/workflows/   CI: Format, Lint, Typen, Tests, Build, Cloudflare-Build, E2E
wrangler.jsonc       Cloudflare Workers (statische PWA, Vorschau-Links)
CLAUDE.md            Arbeitsregeln für die KI-Entwicklung
```

## Arbeitsweise

- **Ein PR = ein Thema**, unter 400 Zeilen, mit Tests; Beschreibung «Was, Warum, Wie getestet».
- **Ablauf:** Plan → Branch (`feat/…`, `fix/…`, `docs/…`) → PR → CI grün → Vorschau-Link prüfen → Squash-Merge auf `main` → automatischer Deploy.
- **Sichtbare Änderungen** kommen mit Screenshots im iPhone-Format und dem Vorschau-Link.
- **Entscheide** stehen als ADR in [`docs/adr/`](docs/adr/); Commit-Messages und Code auf Englisch, UI und Doku auf Deutsch (Schweiz), die App sagt immer «du».
- Regeln im Detail, inkl. Definition of Done: [`CLAUDE.md`](CLAUDE.md).

## Datenschutz und Sicherheit

- Daten bleiben auf dem Gerät, bis es Teilen im Haushalt gibt; danach nur innerhalb des Haushalts.
- Bon- und Barcode-Fotos werden nur im Speicher gelesen, nie gespeichert.
- KI-Erkennung über die KI deiner Wahl: rettich bekommt nur die erkannte Liste ([ADR-0012](docs/adr/0012-bring-your-own-ai.md)).
- Strenge Content-Security-Policy, alle Assets selbst gehostet, kein CDN; der E2E-Test schlägt bei jeder CSP-Verletzung fehl.
- Partner- und KI-Zugriff auf Haushaltsdaten nur mit ausdrücklicher, widerrufbarer Einwilligung; kein Verkauf von Einzeldaten.
- Datenschutzerklärung in einfacher Sprache als Entwurf: [`docs/privacy.md`](docs/privacy.md) (vor dem öffentlichen Start fachlich prüfen).

## Dokumentation

| Dokument | Inhalt |
| --- | --- |
| [`docs/plan.md`](docs/plan.md) | Umsetzungsplan, Schritte, offene Fragen und Antworten |
| [`docs/use-cases.md`](docs/use-cases.md) | Use Cases, Ökosystem- und Büro-Brainstorming |
| [`docs/architecture.md`](docs/architecture.md) | Architektur und Skalierung |
| [`docs/design.md`](docs/design.md) | Design-Tokens, Komponenten, Datumsfeld |
| [`docs/blue-ocean.md`](docs/blue-ocean.md) | Strategie und Monetarisierung |
| [`docs/data-sources.md`](docs/data-sources.md) | Produktdaten-Quellen |
| [`docs/previews.md`](docs/previews.md) | Vorschau-Links auf Cloudflare |
| [`docs/adr/`](docs/adr/) | Architektur-Entscheide (ADR-0001 bis heute) |

## Lizenz

**Proprietär – alle Rechte vorbehalten** ([`LICENSE`](LICENSE), [ADR-0015](docs/adr/0015-licensing-and-business-model.md)). Das hält alle Wege offen: gratis, Freemium mit Abo oder In-App-Käufen, B2B-Lizenzen, später auch Teile als Open Source.

Verwendete Bibliotheken stehen unter permissiven Lizenzen (MIT, Apache-2.0, ISC, BSD, OFL für Schriften); `pnpm licenses:check` und die CI verhindern Copyleft-Abhängigkeiten im ausgelieferten Code. Produktdaten von [Open Food Facts](https://world.openfoodfacts.org) stehen unter der ODbL und werden in der App genannt.

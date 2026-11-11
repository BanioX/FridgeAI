# CLAUDE.md – Rettich

Kurzfassung der Regeln. Vollständiger Brief: [`docs/brief.md`](docs/brief.md) · Plan: [`docs/plan.md`](docs/plan.md) · Strategie: [`docs/blue-ocean.md`](docs/blue-ocean.md) · Use Cases: [`docs/use-cases.md`](docs/use-cases.md) · Entscheide: [`docs/adr/`](docs/adr/).
Karte für alle KI-Werkzeuge: [`AGENTS.md`](AGENTS.md) · SWELP (Darf, Tut, Lernt): [`docs/swelp/`](docs/swelp/) · Schulden: [`docs/schulden.md`](docs/schulden.md) · Glossar: [`docs/glossar.md`](docs/glossar.md).

**Name:** Rettich, mit grossem R («rett' ich»; Alban, 8.11.2026: «Es macht mehr mit dem Auge»). Technische Namen (Dateinamen, Kennungen, Domain) bleiben klein. Claim: «Wirf kein Geld in den Abfall.» Bis 7.11.2026 hiess die App «FridgeAI»; Repo, Pakete `@fridgeai/*`, Datenbank und Web-Adresse bleiben technisch so (ADR-0032).

**Produkt:** Local-first PWA für Schweizer Haushalte (WGs, Paare). «Scan deine Quittung – Rettich weiss, was du hast, wem es gehört, wer was schuldet und was du heute retten musst.» Product Owner: Alban Hyseni.

**Prioritäten** (Alban, 6.11.2026): Kühlschrank zuerst, Vorrat/Tiefkühler/Notvorrat zweitrangig. Design nach Apples Human Interface Guidelines (ADR-0021). Pilot Schweiz, dann DACH, gebaut für jede Währung (ADR-0019). Daten so kurz wie möglich, jederzeit exportier- und löschbar (ADR-0020). Den Pilot (Alban + 1 Person) gibt Claude frei, sobald er startklar ist. Ideen-Sammlung: [`docs/ideen/`](docs/ideen/).

## Sprache
- UI-Texte und Doku: Deutsch (Schweiz), «ss» statt «ß», inklusive Schreibweise (Mitbewohner:innen).
- Die App spricht immer **eine Person mit «du»** an (du, dein, dir), nie «ihr», «euch» oder «euer», auch in WGs und Familien (Alban, 6.11.2026). Ein Test prüft den Textkatalog.
- Code, Bezeichner, Commit-Messages: Englisch.

## Arbeitsweise
1. Erst Plan, dann Code. Abweichungen vom Plan mit Alban klären.
2. Ein PR = ein Thema, < 400 geänderte Zeilen (ohne Lockfile), mit Tests und grünem CI. PR-Beschreibung: Was, Warum, Wie getestet.
3. Kleine Entscheide selbst treffen und als ADR in `docs/adr/NNNN-titel.md` festhalten.
4. **Previews für Alban:** Bei jeder sichtbaren UI-Änderung `pnpm preview:shots <route …>` ausführen und das kompakte `sheet.png` (aus `apps/web/.previews/…`) mit dem PR an Alban schicken, damit er das Design beurteilen kann. Dazu den Cloudflare-Vorschau-Link des PRs nennen ([`docs/previews.md`](docs/previews.md)). Feedback fliesst in einen Folge-PR.
5. **Freigabe:** Alles, was kostenlos ist, darf ich ohne Rückfrage entscheiden und nutzen (Dienste im Gratis-Plan, Open-Source-Dependencies, Tools; Alban, 6.11.2026). **Alban fragen vor:** allem, was Geld kostet, Preis-/Freemium-Grenzen, allem, was Nutzerdaten das Gerät neu verlassen lässt, und grösseren Abweichungen vom Produkt.
6. **Ideen unterwegs:** Bei jeder Arbeit festhalten, was erweiterbar oder zusätzlich sinnvoll wäre, in [`docs/ideen/`](docs/ideen/) (Nutzen, für wen, Aufwand, Kosten). Umsetzen nur, was im Plan steht. Ideen mit Kosten oder neuen Datenflüssen entscheidet Alban. Grosse Hebel mit USP, die Abklärung brauchen (Partner, Verträge, Kosten, Recht), und das Geschäftsmodell parken in [`docs/ideen/parkplatz.md`](docs/ideen/parkplatz.md); bei jedem passenden Gespräch nachführen. Albans Brainstorming sortiert Claude ein (jetzt, später, Parkplatz) und entscheidet, was zum aktuellen Stand passt (7.11.2026).
7. **Tempo:** Claude baut ohne Rückfrage weiter und optimiert, bis das Limit erreicht ist (Alban, 6.11.2026). Die Grenzen aus Punkt 5 gelten weiter.
8. **Lokal zuerst prüfen** (Repo öffentlich seit 11.11.2026, GitHub Actions damit gratis; ADR-0049): jeden Push lokal vollständig prüfen, wenige Pushes pro PR, gestapelte PRs nur wenn nötig, main nicht ohne Grund in Branches mergen. Reine Doku-PRs überspringen Tests und E2E automatisch.
9. **Wenig technische Schulden** (Alban, 7.11.2026): Nebenwirkungen in [`docs/swelp/nebenwirkungen.md`](docs/swelp/nebenwirkungen.md) (Test prüft), bewusste Abkürzungen in [`docs/schulden.md`](docs/schulden.md), Lektionen in [`docs/swelp/lernbuch.md`](docs/swelp/lernbuch.md), Begriffe im [Glossar](docs/glossar.md). Lieber eine Schuld eintragen als sie verschweigen.

## Pflege-Rhythmus (macht immer Claude, nie Alban – ADR-0017)
- **Jeder PR:** Conventional-Commit-Titel; README und Plan-Status nachführen, wenn sich Sichtbares ändert.
- **Wöchentlich:** Dependabot-PRs prüfen und bei grüner CI mergen.
- **Alle 10 gemergten PRs** (`pnpm release --count`) oder am Meilenstein-Ende: Release mit `pnpm release` → Release-PR → Merge → Tag und GitHub Release entstehen automatisch (`release.yml`); Statusmeldung an Alban.
- **Alle 50 PRs:** Gesundheits-Check (Dependencies, Lizenzen, Bundle, tote Dateien, Doku, Tests, Sicherheits-Review).
- **Alle 100 PRs:** grosses Review (Architektur, Plan, ADRs, Performance, Barrierefreiheit) mit Roadmap-Vorschlag.

## Harte Regeln
- Keine echten Partner-Integrationen (Verträge, Konten, Bestellungen bei Migros, Coop, Lieferdiensten): nur Interfaces mit Mocks. Öffentliche Produktdaten der Händler-Websites sammelt ein höflicher Crawler (ADR-0045, Alban 8.11.2026): ehrlicher Name, robots.txt beachten, nie Bot-Schutz umgehen, nur Fakten, Abgleich auf dem Gerät.
- Keine Secrets im Repo (`.env.example` ja, echte Keys nie). Keine personenbezogenen Daten in Fixtures, Logs oder Commits.
- Geld immer als Ganzzahl in der kleinsten Einheit der Haushaltswährung (CHF: Rappen), nie Float (ADR-0019). Salden und Metriken werden berechnet, nicht gespeichert.
- Ablaufdaten als Kalendertag (`YYYY-MM-DD`, Europe/Zurich), Zeitpunkte als ISO-UTC.
- `packages/core` ist reines TypeScript ohne Browser-Abhängigkeit; Äusseres nur über Ports.
- Contract-first: Die UI ruft nur Commands/Queries der Schnittstelle (Zod-Schemas, im Code `contract`) auf, Änderungen erzeugen Domain Events. So bleiben REST-API und MCP-Server später ohne Umbau möglich (Plan, Abschnitt 2).
- Partner- oder KI-Zugriff auf Haushaltsdaten nur mit ausdrücklicher, widerrufbarer Einwilligung pro Haushalt. Kein Verkauf von Einzeldaten.
- Bilder von Quittungen werden nach der Auswertung nicht gespeichert (ausser expliziter Opt-in). Assets (OCR-Modelle, Worker) selbst hosten, kein CDN.
- TypeScript `strict`, kein `any`. Neue Dependencies nur kostenlos, gut gepflegt und schlank, im PR begründen; im ausgelieferten Code nur permissive Lizenzen (MIT, Apache-2.0, ISC, BSD, OFL), nirgends GPL/AGPL (`pnpm licenses:check`, ADR-0015).
- Lizenz: proprietär, alle Rechte bei Alban (`LICENSE`). Das Repo ist öffentlich einsehbar, frei verwenden darf den Code trotzdem niemand. Keine fremden Code-Schnipsel mit unklarer Lizenz übernehmen.
- **Keine Adresse der App im Repo** und die App nie in Suchmaschinen (Alban, 11.11.2026; ADR-0049): `X-Robots-Tag` und `meta robots` stehen auf `noindex`.
- Kamera nur nach Nutzeraktion, alle Berechtigungszustände und Fallbacks (Foto-Upload, manuell) behandeln.

## Befehle
Node 24 und pnpm 10 (über `packageManager`/Corepack). Vor jedem Push alles grün:

```
pnpm install
pnpm format:check   # pnpm format zum Korrigieren
pnpm lint
pnpm typecheck      # inkl. Reinheits-Check von packages/core
pnpm test           # pnpm test:coverage für Abdeckung
pnpm build
pnpm e2e            # Playwright; lokal ggf. PW_CHROMIUM_EXECUTABLE setzen
```

Stack und Versionsentscheide: [`docs/adr/0002-tech-stack-and-tooling.md`](docs/adr/0002-tech-stack-and-tooling.md).

## Agent-Orchestrierung
- Rettich ist der erste Kontext des **SWELPER** ([`BanioX/SWELPER`](https://github.com/BanioX/SWELPER), ADR-0044): Alban legt Ideen in den Trichter, der Dispatcher sortiert und zerlegt sie in Aufträge (Issues dort, Labels `ctx:rettich`), Stecker erledigen sie. Befehle in jeder Sitzung: `/swelper status`, `/swelper pick`, `/swelper add`, `/swelper done`, `/trichter`, `/tagesbericht`.
- `.claude/agents/`, `.claude/skills/`, `.claude/swelper/` und der SessionStart-Hook sind **erzeugt** (`generated: swelper <version>`) und werden nur im Rahmen geändert, dann mit `python -m swelper sync <pfad-zu-rettich>` nachgezogen. Ein Test prüft die Markierung. Nie von Hand editieren.
- Der Kontext von Rettich (Rollen, Modelle, Prüfbefehle, Gates) steht in `.swelper.json` und gehört dem Projekt (SWELPER ADR-0003); Lese-Rollen schreiben nach `docs/swelper/<rolle>/`. Rollen: Dispatcher (opus) plant, reviewt **jedes** Ergebnis und merged als Einziger; `implementer` (sonnet) und `helper` (haiku) arbeiten im eigenen Worktree nur in den Pfaden ihres Auftrags; `reviewer` (sonnet) liest; CEO, Marketing, Design, Recht und Finanzen schreiben nur in den Rahmen. Regeln für alle: `.claude/swelper/standing-orders.md`.
- Nur Modell-Aliase (`opus`, `sonnet`, `haiku`; `fable` auf Albans Zuruf). Jeder Auftrag nennt Ziel, Dateien, Akzeptanzkriterien, Tabu-Bereiche und Testweg; der SWP-Auftrag im Worktree macht ihn erzwingbar, sobald SWELP im Projekt läuft.

## Definition of Done (pro PR)
- [ ] Akzeptanzkriterien der User Story erfüllt
- [ ] Lint, Typecheck, Unit-Tests, E2E für Kern-Flows grün
- [ ] Offline-Verhalten und Kamera-Fallbacks bedacht
- [ ] Keine personenbezogenen Daten in Logs, Fixtures, Commits
- [ ] UI-Texte de-CH, a11y-Basics (Labels, Kontrast, Fokus)
- [ ] Doku/ADR aktualisiert
- [ ] Von Opus reviewt

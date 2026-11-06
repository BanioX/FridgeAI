# CLAUDE.md – FridgeAI

Kurzfassung der Regeln. Vollständiger Brief: [`docs/brief.md`](docs/brief.md) · Plan: [`docs/plan.md`](docs/plan.md) · Strategie: [`docs/blue-ocean.md`](docs/blue-ocean.md) · Use Cases: [`docs/use-cases.md`](docs/use-cases.md) · Entscheide: [`docs/adr/`](docs/adr/).

**Produkt:** Local-first PWA für Schweizer Haushalte (WGs, Paare). «Scan deinen Bon – FridgeAI weiss, was ihr habt, wem es gehört, wer was schuldet und was ihr heute retten müsst.» Product Owner: Alban Hyseni.

## Sprache
- UI-Texte und Doku: Deutsch (Schweiz), «ss» statt «ß», Du-Form, inklusive Schreibweise (Mitbewohner:innen).
- Code, Bezeichner, Commit-Messages: Englisch.

## Arbeitsweise
1. Erst Plan, dann Code. Abweichungen vom Plan mit Alban klären.
2. Ein PR = ein Thema, < 400 geänderte Zeilen (ohne Lockfile), mit Tests und grünem CI. PR-Beschreibung: Was, Warum, Wie getestet.
3. Kleine Entscheide selbst treffen und als ADR in `docs/adr/NNNN-titel.md` festhalten.
4. **Previews für Alban:** Bei jeder sichtbaren UI-Änderung `pnpm preview:shots <route …>` ausführen und das kompakte `sheet.png` (aus `apps/web/.previews/…`) mit dem PR an Alban schicken, damit er das Design beurteilen kann. Dazu den Cloudflare-Vorschau-Link des PRs nennen ([`docs/previews.md`](docs/previews.md)). Feedback fliesst in einen Folge-PR.
5. **Alban fragen vor:** Backend/Hosting, Auth, Framework-Wechsel, serverseitigem OCR/LLM, neuen grösseren Dependencies oder kostenpflichtigen Diensten, Preis-/Freemium-Grenzen, allem, was Daten das Gerät verlassen lässt, Abweichungen vom MVP-Umfang.

## Harte Regeln
- Keine echten Partner-Integrationen (Migros, Coop, Lieferdienste): nur Interfaces mit Mocks.
- Keine Secrets im Repo (`.env.example` ja, echte Keys nie). Keine personenbezogenen Daten in Fixtures, Logs oder Commits.
- Geld immer als Integer-Rappen, nie Float. Salden und Metriken werden berechnet, nicht gespeichert.
- Ablaufdaten als Kalendertag (`YYYY-MM-DD`, Europe/Zurich), Zeitpunkte als ISO-UTC.
- `packages/core` ist reines TypeScript ohne Browser-Abhängigkeit; Äusseres nur über Ports.
- Contract-first: Die UI ruft nur Commands/Queries des Vertrags (Zod-Schemas) auf, Änderungen erzeugen Domain Events. So bleiben REST-API und MCP-Server später ohne Umbau möglich (Plan, Abschnitt 2).
- Partner- oder KI-Zugriff auf Haushaltsdaten nur mit ausdrücklicher, widerrufbarer Einwilligung pro Haushalt. Kein Verkauf von Einzeldaten.
- Bon-Bilder werden nach der Auswertung nicht gespeichert (ausser expliziter Opt-in). Assets (OCR-Modelle, Worker) selbst hosten, kein CDN.
- TypeScript `strict`, kein `any`. Keine neue Dependency ohne Freigabe (Liste in `docs/plan.md`, Frage 6).
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
- Opus: Plan, Architektur, ADRs, Datenmodell, Ports, Parser-Strategie, Sync, Geldlogik, Sicherheit/Datenschutz, Review **jedes** Subagent-Ergebnisses.
- `implementer` (sonnet): klar spezifizierte, mittelgrosse Features.
- `helper` (haiku): Boilerplate, einfache Komponenten, Tests zu fertiger Logik, Fixtures, Doku.
- `reviewer` (sonnet): zweite Meinung zu Sicherheit, Datenschutz, Testlücken.
- Nur Modell-Aliase verwenden (`opus`, `sonnet`, `haiku`). Jeder Auftrag nennt Ziel, Dateien, Typen, Akzeptanzkriterien, Tabu-Bereiche und Testweg.

## Definition of Done (pro PR)
- [ ] Akzeptanzkriterien der User Story erfüllt
- [ ] Lint, Typecheck, Unit-Tests, E2E für Kern-Flows grün
- [ ] Offline-Verhalten und Kamera-Fallbacks bedacht
- [ ] Keine personenbezogenen Daten in Logs, Fixtures, Commits
- [ ] UI-Texte de-CH, a11y-Basics (Labels, Kontrast, Fokus)
- [ ] Doku/ADR aktualisiert
- [ ] Von Opus reviewt

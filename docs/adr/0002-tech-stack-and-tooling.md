# ADR-0002: Tech-Stack und Tooling

- **Status:** angenommen
- **Datum:** 2026-11-06

## Kontext

Der Brief (§5) empfiehlt eine installierbare PWA mit Vite, React und TypeScript, später verpackt mit Capacitor. Beim Aufsetzen (6.11.2026) waren mehrere Werkzeuge in neuen Major-Versionen erschienen, die nicht alle zueinander passen.

## Entscheid

| Bereich | Wahl | Begründung |
| --- | --- | --- |
| Laufzeit | Node 24 LTS (`.nvmrc`) | Aktuelle LTS-Linie, in CI und lokal identisch |
| Paketmanager | pnpm 10.34.x über `packageManager`, in CI per Corepack | Gepflegte, bekannte Linie. Corepack statt `pnpm/action-setup`, damit nur eine Quelle die Version bestimmt |
| Sprache | TypeScript **6.0** | TypeScript 7 (nativer Compiler) wird von typescript-eslint noch nicht unterstützt (`<6.1`). Wechsel, sobald das Lint-Tooling nachzieht |
| Strenge | `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, `erasableSyntaxOnly` | Fehler früh finden; keine Enums/Namespaces, damit Code auch mit reinem Type-Stripping läuft |
| Reinheit von `core` | `packages/core/tsconfig.src.json` ohne DOM- und Node-Typen, zusätzlich `no-restricted-globals` in ESLint | Ports-and-Adapters wird vom Compiler erzwungen, nicht nur per Konvention |
| Lint | ESLint 10 (flat config), typescript-eslint `strictTypeChecked` + `stylisticTypeChecked` | Typbasiertes Linting, `any` verboten |
| Format | Prettier für Code; **Markdown ausgenommen** | Doku-Tabellen sollen keine Format-Diffs erzeugen |
| Tests | Vitest 5 mit Projekten (je Paket), v8-Coverage; Schwelle 90 % Zeilen für `packages/core/src` | Ein Befehl für alle Pakete |
| E2E | Playwright (nur Chromium im MVP), axe-Checks | Gemäss Brief §9 |
| Build/UI | Vite 8, React 19, React Router 8 (Data Router, SPA), Tailwind CSS 4, `vite-plugin-pwa` | Statischer Build, Capacitor-tauglich |
| CI | GitHub Actions auf Node-24-Majors (`checkout@v6`, `setup-node@v6`, `upload-artifact@v7`) | Node-20-Actions werden seit Herbst 2026 nicht mehr unterstützt |
| Updates | Dependabot wöchentlich, gruppiert nach Dev/Runtime | Wenig Lärm, trotzdem aktuell |

## Konsequenzen

- Sobald typescript-eslint TypeScript 7 unterstützt, prüfen wir den Wechsel (schnellere Typprüfung).
- Neue Dependencies nur gemäss freigegebener Liste in `docs/plan.md` (Frage 6) oder nach Rückfrage.

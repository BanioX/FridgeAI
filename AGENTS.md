# AGENTS.md – Einstieg für KI-Assistenten (Claude Code, Cursor, Codex, Gemini …)

Rettich ist eine local-first PWA für Schweizer Haushalte: Sie zeigt, was du verwertest und was du entsorgst, und was es kostet (ADR-0046). Diese Datei ist die Karte. Die Regeln stehen in [`CLAUDE.md`](./CLAUDE.md) und gelten für jedes Werkzeug, nicht nur für Claude.

## Lesereihenfolge vor jeder Änderung

0. [`docs/swelp/uebergabe.md`](./docs/swelp/uebergabe.md): wo die Arbeit gerade steht und was als Nächstes kommt.
1. [`CLAUDE.md`](./CLAUDE.md): Sprache, Arbeitsweise, harte Regeln, Befehle, Definition of Done.
2. [`docs/swelp/README.md`](./docs/swelp/README.md): was der Code darf (Darf), was er bewirkt (Tut, [`nebenwirkungen.md`](./docs/swelp/nebenwirkungen.md)), was wir gelernt haben (Lernt, [`lernbuch.md`](./docs/swelp/lernbuch.md)).
3. [`docs/schulden.md`](./docs/schulden.md): bekannte Schulden; nichts davon unbemerkt vergrössern.
4. [`docs/glossar.md`](./docs/glossar.md): Begriffe in App, Code und Regionen.
5. Das passende ADR (Verzeichnis mit Status: [`docs/adr/README.md`](./docs/adr/README.md)) und der Plan in [`docs/plan.md`](./docs/plan.md), Abschnitt «Stand nach 200 PRs».

## Karte des Codes (drei Schichten, ADR-0034)

| Schicht | Ort | Darf importieren | Inhalt |
| --- | --- | --- | --- |
| Logik | `packages/core/src` | nur sich selbst und `zod` (kein DOM, kein Node, kein Dexie, kein React) | `contract/` Schnittstelle v1 (Befehle, Abfragen, Ereignisse) · `application/` Anwendungsfälle · `ports/` Speicher und Aussenwelt (`storage.ts`, `memory-storage.ts`, Mocks) · `model/` · `catalog/` Kategorien · `receipt/` Quittungs-Parser, Abgleich · `nutrition/` Nährwert-Etiketten · `money.ts`, `currency.ts`, `expiry.ts`, `dates.ts` |
| Daten | `apps/web/src/data` | core, Dexie | `dexie-storage.ts` (Ports auf IndexedDB) · `handlers.ts` (dünne Adapter) · Open Food Facts, Bild- und Produkt-Cache |
| Präsentation | `apps/web/src/features/<bereich>`, `apps/web/src/ui`, `apps/web/src/app` | core und `useAppData()`; nie `data/` oder `dexie` (ESLint) | Seiten pro Bereich · Bausteine · Shell, Routen, Texte (`messages.de-CH.ts`), `useMoney()` |
| Tests | `packages/core/test`, `apps/web/src/**/*.test.ts(x)`, `apps/web/e2e` | – | Vitest (Logik ohne Browser auf `createMemoryStorage`), Playwright mit axe; `e2e/test.ts` blockiert Open Food Facts |

## Befehle

```
pnpm install && pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
PW_CHROMIUM_EXECUTABLE=<chrome> pnpm e2e -- --trace off      # vorher: curl -s localhost:4173 liefert nichts? (L-02, L-15)
pnpm preview:shots <route …>                               # Bilder für Alban bei sichtbaren Änderungen
```

## Was eine Änderung immer mitbringt

- **Eine neue Nebenwirkung:** Netz, Gerätespeicher oder Geräte-Funktion steht im selben PR in `docs/swelp/nebenwirkungen.md`. Der Test `apps/web/src/swelp.test.ts` prüft das. Verlassen Daten neu das Gerät: vorher Albans Entscheid.
- **Eine bewusste Abkürzung:** kommt in `docs/schulden.md`.
- **Eine Lektion aus einem Fehler:** kommt in `docs/swelp/lernbuch.md`.
- **Ein neuer Begriff:** kommt ins Glossar. Texte gibt es nur in `messages.de-CH.ts`; ein Test prüft «du» und «ss».

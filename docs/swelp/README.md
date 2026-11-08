# SWELP für Rettich: was der Code darf, was er tut, was wir gelernt haben

Alban (7.11.2026): «Baue so weiter, dass so wenige Technical Debts wie möglich entstehen. Führe eine Coding-Bibliothek oder Dokumentation nach, mit Sinn für Mensch und Sinn für Maschine.» Die Idee stammt aus SWELP (Scoped Work, Side Effect, Self Learning Protocols).

Jede Datei hier ist zweimal lesbar:

- **für Menschen** in klaren Sätzen,
- **für Maschinen** als Tabelle mit festen Spalten und stabilen Kennungen (`SE-…`, `L-…`, `TD-…`). Tests und KI-Assistenten lesen sie mit.

| Protokoll | Frage | Wo es steht | Wer entscheidet | Wie es geprüft wird |
| --- | --- | --- | --- | --- |
| **Darf** (Scoped Work) | Was darf der Code, was darf eine KI daran ändern? | [`../../CLAUDE.md`](../../CLAUDE.md) (harte Regeln), [`../../AGENTS.md`](../../AGENTS.md) (Karte), [ADR-0034](../adr/0034-three-layers.md) (Schichten) | Alban, für alles mit Kosten oder neuen Datenflüssen | ESLint-Schichtgrenzen, Reinheits-Check von `packages/core`, Lizenz-Check |
| **Tut** (Side Effect) | Was bewirkt der Code in der Welt: Netz, Speicher, Gerät? | [`nebenwirkungen.md`](./nebenwirkungen.md) | Alban, für jede neue Nebenwirkung, die Daten vom Gerät schickt | `apps/web/src/swelp.test.ts` vergleicht Register, CSP und Code |
| **Lernt** (Self Learning) | Was haben wir gelernt, damit derselbe Fehler nicht zweimal passiert? | [`lernbuch.md`](./lernbuch.md) | Claude schlägt vor, Alban kann jede Lektion streichen | jede Lektion nennt ihren Beleg (PR, Test) |

Dazu gehören zwei Register:

- [`../schulden.md`](../schulden.md): bekannte technische Schulden mit Plan, damit keine still wachsen.
- [`../glossar.md`](../glossar.md): Begriffe in der App, im Code und in den Regionen, damit Mensch und Maschine dasselbe meinen.

## Pflege

- **Jeder PR:**
  - Kommt eine Nebenwirkung dazu oder fällt eine weg, wird `nebenwirkungen.md` im selben PR nachgeführt. Der Test bricht sonst ab.
  - Entsteht eine bewusste Abkürzung, kommt sie mit Kennung in `schulden.md`. Wird eine abgebaut, wird sie dort als erledigt markiert.
  - Zeigt ein Fehler etwas Allgemeines, kommt eine Lektion ins `lernbuch.md`.
- **Alle 50 PRs** (Gesundheits-Check, CLAUDE.md): Schulden priorisieren, veraltete Lektionen entfernen.

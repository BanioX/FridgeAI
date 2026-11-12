# ADR-0065: Ideen und Vergleiche bleiben privat

- **Status:** angenommen
- **Datum:** 2026-11-12
- **Entscheid von:** Alban

## Kontext

Das Repo ist seit 11.11.2026 öffentlich einsehbar (ADR-0049). Darin lagen auch Ideen, Strategie, die Reihenfolge der nächsten Schritte und Vergleiche mit anderen Apps. Alban (12.11.2026) will, dass Fremde auf GitHub weder seine Ideen noch seine Vergleiche sehen.

## Entscheid

1. **Hier steht, was gebaut ist und wie.** Regeln, Entscheide, Architektur, Design, Register (Nebenwirkungen, Schulden, Lernbuch, Glossar, Flächen) und der Stand.
2. **Privat liegen** Ideen, Strategie, was Geld einbringen soll, die Reihenfolge der nächsten Schritte, offene Fragen an Alban und jeder Vergleich mit einer anderen App. Der Ablageort heisst `rettich-intern` und ist nur für Alban und Claude lesbar.
3. **Keine andere App als Vergleich oder Vorbild,** weder in Dateien noch in Code-Kommentaren, Tests, Commits, Branch-Namen, PR-Titeln und PR-Texten. Was eine Funktion tut, lässt sich immer ohne fremden Namen sagen.
4. **Erlaubt bleiben** Namen, die die App selbst braucht: die Läden, deren Quittungen Rettich liest (ADR-0037), die Datenquellen (Open Food Facts, Open Food Repo, Schweizer Nährwertdatenbank) und Plattformen und Werkzeuge.
5. **Der Verlauf ist neu geschrieben** (12.11.2026): Die Dokumente haben in diesem Repo keinen älteren Verlauf mehr, im Code sind die Vergleiche entfernt. Der alte Stand liegt privat.
6. **Ein Test wacht:** `apps/web/src/private-ideas.test.ts` bricht, wenn eine Datei eine der gelisteten Apps nennt oder eines der ausgelagerten Dokumente zurückkommt. Die Liste steht als Hash im Test, damit sie selbst nichts verrät; die Klartext-Liste liegt privat.

## Folgen

- Ältere Commit-Kennungen gelten nicht mehr. Die Release-Tags zeigen auf die neuen Commits.
- Der Test kennt nur gelistete Namen. Bei einem neuen Vergleich hilft nur die Regel in `CLAUDE.md` (Arbeitsweise, Punkt 6) und das Review.
- Commits und PR-Texte prüft kein Test. Wer einen PR schreibt, liest Titel und Text vor dem Absenden auf Ideen und Vergleiche durch.
- `.swelper.json` und die erzeugten Dateien unter `.claude/` nennen noch die alten Pfade, bis der nächste `swelper sync` sie nachzieht (TD-23).

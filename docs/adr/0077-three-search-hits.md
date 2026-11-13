# ADR-0077: Drei Suchtreffer zuerst

- **Status:** angenommen
- **Datum:** 2026-11-13
- **Entscheid von:** Claude, auf Albans Wunsch («Simplicity, effizient», 13.11.2026)

## Kontext

Beim Erfassen von Hand zeigt die Suche unter «Was ist es?» eigene Produkte (bis 5) und Treffer aus Open Food Facts (bis 10). Ein häufiges Wort wie «Milch» brachte neun Treffer, viele davon Pflanzendrinks. Datum und «Speichern» rutschten damit weit nach unten, das Formular wirkte unruhig.

## Entscheid

1. Zuerst stehen höchstens **drei Treffer**, eigene Produkte («Bereits verwendet») vor denen aus Open Food Facts (`FIRST_HITS` in `NameSearch.tsx`).
2. Gibt es mehr, steht darunter ein leiser Knopf **«Weitere Treffer (n)»**. Er öffnet alle Treffer zum aktuellen Suchwort; wer weitertippt, sieht wieder die ersten drei.
3. Gesucht wird wie bisher (ADR-0024, ADR-0025): nichts ändert sich an Abfrage, Pause oder Datenfluss.

## Folgen

- Mit Netz bleibt das Formular kurz, Datum und «Speichern» stehen näher am Namen.
- Ein klebender «Speichern»-Knopf über der Tab-Leiste ist ein eigener Schritt, falls das Formular weiter zu lang ist.

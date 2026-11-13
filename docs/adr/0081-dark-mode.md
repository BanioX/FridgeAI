# ADR-0081: Dunkelmodus nach Einstellung des Geräts

- **Status:** angenommen
- **Datum:** 2026-11-13
- **Entscheid von:** Alban («Ja Dunkelmodus», 13.11.2026)

## Kontext

Auf dem iPhone nutzen viele den Dunkelmodus. Eine App, die abends hell bleibt, wirkt wie eine Webseite. Die Farben von Rettich sind schon Tokens (CSS-Variablen, ADR-0035), also lässt sich der Dunkelmodus an einer Stelle bauen.

## Entscheid

1. **Rettich folgt dem Gerät** (`prefers-color-scheme: dark`), ohne eigenen Schalter. `color-scheme` und `theme-color` passen sich an, damit Eingabefelder, Statusleiste und Tastatur ebenfalls dunkel sind.
2. **Dieselben Tokens, andere Werte** (`apps/web/src/index.css`): ein fast schwarzer Grund, dunkles Silber für Flächen, helles Onyx für Schrift. Die Werte stehen in `docs/design.md`.
3. **Grün und Rot als Text werden nachts heller**, als Fläche mit weisser Schrift bleiben sie. So halten beide WCAG AA.
4. **«Verwertet» im Kreis zeichnet mit der Schriftfarbe**: Onyx am Tag, hell in der Nacht. Die Bedeutung aus ADR-0075 bleibt.
5. **Ein Test prüft die Hauptseiten im Dunkelmodus** mit axe, Kontrast inklusive (`e2e/dark-mode.spec.ts`).

## Folgen

- Keine Komponente braucht eigene Dunkel-Klassen; neue Seiten sind automatisch dunkel, solange sie Tokens nutzen.
- Ein Schalter Hell/Dunkel/System unabhängig vom Gerät kann später unter «Mehr» kommen.
- Die PDF-Auszüge bleiben hell, sie sind zum Drucken und Teilen.

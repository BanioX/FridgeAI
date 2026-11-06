# ADR-0021: Design nach Apples Human Interface Guidelines

- **Status:** angenommen
- **Datum:** 2026-11-06

## Kontext

Alban (6.11.2026): «Wegen Design orientiere dich an die Apple-Designsprache.» Die meisten Pilotnutzer:innen haben ein iPhone. Eine PWA, die sich wie eine iOS-App anfühlt, wird eher installiert und täglich geöffnet. Das bisherige Design (design.md) setzt auf selbst gehostete Schriften (Fraunces, Figtree) und ein eigenes Kartenbild.

## Entscheid

Leitlinie sind Apples Human Interface Guidelines, umgesetzt mit Web-Mitteln:

- **Schrift:** Systemschrift (`system-ui, -apple-system`, also SF Pro auf Apple-Geräten, Roboto auf Android). SF Pro darf nicht selbst gehostet werden (Lizenz nur für Apple-Plattformen), über die Systemschrift ist sie trotzdem da und muss nicht geladen werden. Fraunces und Figtree fallen weg.
- **Typografie:** Grosse Titel (34 px fett) oben auf jeder Hauptseite. Textgrössen nach Apples Stufen (Body 17 px, Subheadline 15 px, Footnote 13 px), in `rem`, damit die Schriftgrösse des Systems wirkt.
- **Listen:** «Inset grouped»: Gruppen mit Überschrift, Zeilen mit feinen Trennlinien statt einzelner Karten. Zeilen mit Chevron, wenn sie weiterführen.
- **Bedienung:**
  - Segmented Controls für wenige Optionen. Tab-Bar unten mit Material-Unschärfe.
  - Sheets von unten für Aktionen statt langer Seiten.
  - Mindestens 44 px Tippfläche.
- **Farbe:** Die Markenfarbe Grün wird zur «Tint Color» für Aktionen. Flächen werden neutral (Systemgrau). Dunkelmodus folgt später über dieselben Tokens.
- **Icons:** Lucide mit dünner Linie, wie SF Symbols. Keine Apple-Icons kopieren.
- **Bewegung:** kurz und federnd, «Reduce Motion» respektieren.

## Konsequenzen

- Umbau in kleinen PRs: zuerst Schrift und Titel, dann Listen, dann Sheets. Jede Stufe mit Vorschaubildern für Alban.
- design.md wird nachgeführt. Die Farben bleiben, Schrift und Komponenten ändern sich.
- Die App lädt zwei Schriftpakete weniger, startet also schneller.
- Android sieht weiter gut aus (Roboto, gleiche Abstände). Es ist keine Kopie von iOS.

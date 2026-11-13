# ADR-0089: Eine Frage nach einer Woche

- **Status:** angenommen
- **Datum:** 2026-11-13
- **Entscheid von:** Claude (Freigabe für Kostenloses, Alban 6.11.2026; «Mach das, was du grad umsetzen kannst», 13.11.2026)

## Kontext

Der Pilot läuft mit zwei Personen. Was im Alltag stört, erfährt Rettich bisher nur, wenn jemand es Alban sagt. Tracking kommt nicht in Frage (ADR-0020): nichts soll das Gerät neu verlassen.

## Entscheid

1. **Wann:** Nach sieben Tagen seit dem ersten Start (Erstellung des Haushalts) fragt Start unten in einer ruhigen Karte «Was hat dich diese Woche an Rettich gestört?». Nach einer Antwort fragt Rettich frühestens nach 14 Tagen wieder. «Später» wartet drei Tage, «Nicht mehr fragen» hört auf. Die Regel `shouldAskFeedback` ist rein und getestet.
2. **Was gespeichert wird:** nur der Text (höchstens 500 Zeichen) und der Zeitpunkt, in der neuen Tabelle `feedback` (Dexie Version 8), über `feedback.save`, `feedback.list` und `feedback.delete` der Schnittstelle. Die Antworten gehören zum Gesamt-Export und kommen mit dem Import zurück; ältere Exporte ohne Tabelle gelten als leer.
3. **Löschen löscht den Text:** Eine gelöschte Antwort behält Kennung und Zeitpunkt, aber keinen Text mehr, auch nicht im Export.
4. **Sehen und löschen** unter «Mehr › Deine Daten» in «Deine Rückmeldungen», nur wenn es welche gibt.
5. «Später» und «Nicht mehr fragen» merkt sich das Gerät (`fridgeai:feedback-ask`, SE-31), nicht der Export.

## Folgen

- Die Antworten erreichen Alban nur, wenn die Person ihren Export teilt. Das ist gewollt: Sie entscheidet.
- Die Frage steht in der Datenschutz-Notiz der App und in `docs/privacy.md`.

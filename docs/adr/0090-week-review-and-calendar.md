# ADR-0090: Wochenrückblick und Kalender-Erinnerung ohne Server

- **Status:** angenommen
- **Datum:** 2026-11-13
- **Entscheid von:** Claude (Freigabe für Kostenloses, Alban 6.11.2026; «Mach das, was du grad umsetzen kannst», 13.11.2026)

## Kontext

Rettich meldet sich bisher nur, wenn man die App öffnet. Echte Mitteilungen bräuchten einen Server, der Ablaufdaten kennt: ein neuer Datenfluss, den Alban entscheidet. Bis dahin soll Rettich zwei Wege nutzen, die ohne Server auskommen.

## Entscheid

1. **«Deine Woche» auf Start** von Montag bis Mittwoch: Verwertet und Entsorgt der Kalenderwoche davor (Montag bis Sonntag, `previousWeek`), mit Anzahl. Ohne Entsorgtes ein ruhiger Satz, sonst der Weg ins Journal. «Gesehen» blendet die Karte bis zur nächsten Woche aus; das merkt sich das Gerät (`fridgeai:week-review-seen`, SE-30), nicht der Export. Ohne Abschluss in der Woche bleibt die Karte weg. Die Zahlen kommen aus derselben Abfrage wie die Bilanz (`stats.waste`).
2. **«Im Kalender erinnern»** auf der Artikelseite: eine Kalenderdatei (RFC 5545) mit einem Termin am Abend vor dem Datum um 18 Uhr Schweizer Zeit, 15 Minuten, mit Hinweis zu Beginn. `calendarReminderFile` in `packages/core` baut sie (Zeilenumbruch CRLF, Zeilen über 75 Byte umgebrochen, Sonderzeichen maskiert, Zeitzone mit Sommerzeitregel). Die UID ist pro Artikel und Tag fest, ein zweites Speichern ändert den Termin statt ihn zu verdoppeln. Das iPhone bietet die Datei zum Hinzufügen an. Ist der Abend schon vorbei, fehlt der Knopf.

## Folgen

- Kein Server, kein neuer Datenfluss: Die Kalenderdatei entsteht auf dem Gerät und verlässt es nur, wenn die Person sie in ihren Kalender übernimmt.
- Ändert sich das Datum später, bleibt der alte Termin im Kalender, bis die Person neu speichert. Echte Mitteilungen über einen Server bleiben ein Entscheid von Alban.
- Die Karte erscheint nur, wenn Rettich in diesen Tagen geöffnet wird; sie ist ein Rückblick, kein Wecker.

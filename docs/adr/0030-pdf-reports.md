# ADR-0030: Berichte als PDF, auf dem Gerät erzeugt

- **Status:** angenommen
- **Datum:** 2026-11-07

## Kontext

Alban (7.11.2026): «Ich will das Kunden Fancy PDF Dashboard generieren können. Aktueller Status (was im Kühlschrank liegt), wie viel gespart wurde, wie viel entsorgt wurde, verschiedene intelligente Reports. JSON und CSV sind gut, aber Kunden wollen PDF. Mach daraus die neuen Quality-of-Life-Features.»

FridgeAI ist local-first (ADR-0003). Es gibt keinen Server mit den Daten des Haushalts.

## Entscheid

- **Daten im Kern, Darstellung in der App.**
  - `buildReport` in `packages/core` rechnet alles aus, rein und getestet:
    - Kühlschrank jetzt: Anzahl, Wert und Ort; was abgelaufen ist oder in drei Tagen abläuft.
    - Gerettet und weggeworfen im Zeitraum: CHF, kg, Quote, pro Monat (höchstens zwölf).
    - Was am meisten im Abfall landet und warum.
    - Ausgaben pro Laden aus den Bons.
  - Die App ruft das über eine Query der Schnittstelle ab. Dieselben Berichte gehen später über REST oder MCP, ohne Umbau.
- **Das PDF entsteht auf dem Gerät** mit jsPDF (MIT, gepflegt) und jspdf-autotable (MIT).
  - Beide werden erst geladen, wenn ein Bericht erstellt wird.
  - Nichts verlässt das Gerät, bis die Person das PDF selbst teilt (Teilen-Menü oder Download).
- **Ein Bericht:** Kühlschrank jetzt, Wirkung, Einkäufe & Preise in einem PDF; die Auswahl der Berichtsart entfiel am 7.11.2026 auf Wunsch des Product Owners. Als Zeitraum gibt es diesen Monat, die letzten 3 Monate oder dieses Jahr.
- **Gestaltung:** im App-Stil, mit Kennzahl-Kacheln, Balken pro Monat und Tabellen.
  - Die Standardschrift Helvetica deckt Umlaute, «» und – ab. Emojis lässt das PDF weg.
  - Geschätzte Werte sind markiert («geschätzt»), wie in der App.

## Konsequenzen

- Etwa 400 KB zusätzlicher Code, nur bei Bedarf geladen und danach offline verfügbar.
- Die Zahlen im PDF und in der App stammen aus derselben Rechnung.
- Später möglich: weitere Berichte (Jahresrückblick, pro Person), ein Vergleich mit dem Schweizer Durchschnitt (nur mit Quellenangabe) und ein Monatsbericht von selbst.

## Nachtrag (7.11.2026): Der Bericht öffnet in der App

Alban: «Wenn ich PDF erstellen klicke, kommt direkt das Feld, wo ich es hinspeichern will.» Er wünscht es wie bei einem Beleg in der Banking-App.

- «PDF erstellen» öffnet den Bericht auf einer eigenen Seite in der App (`/more/reports/view`).
- pdf.js (schon für die Bons da) zeichnet die Seiten auf dem Gerät, darunter steht jeweils «1 von 2».
- Oben links steht «‹ Berichte», auch die Zurück-Geste des Handys führt zurück. Oben rechts steht «Teilen» (Teilen-Menü, sonst Download).
- Der Bericht liegt nur im Arbeitsspeicher. Nach einem Neuladen bittet die Seite, ihn neu zu erstellen. Gespeichert wird nichts.

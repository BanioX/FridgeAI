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
- **Das PDF entsteht auf dem Gerät** mit jsPDF (MIT, gepflegt); jspdf-autotable (MIT) fiel am 7.11.2026 weg.
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

## Nachtrag (7.11.2026): Der Bericht in der Design-Sprache der App

Alban: «Mit dem Layout nicht zufrieden, eventuell fancy Grafiken oder Diagramme.» Zum ersten Entwurf: «Es hat nicht die gleiche Design-Sprache, kein Premium-Look.» Der Bericht sieht jetzt aus wie die App auf Papier (ADR-0021, ADR-0035, `docs/design.md`):

- **Grund und Karten:** silberner Grund, weisse Karten ohne Rahmen mit weichem Schatten und 16-px-Ecken, grosse Titel wie «Start» und «Vorrat».
- **Seite 1:**
  - App-Symbol mit «rettich», darunter «Dein Bericht».
  - Die Onyx-Karte wie auf Start: der gerettete Betrag mit einem Satz («hast du vor dem Kübel gerettet»), die Rettungsquote als Ring.
  - Drei weisse Kacheln: im Vorrat, weggeworfen, eingekauft.
  - «Was auffällt» als grüne Tipp-Karte wie «Kühlschrank-Check».
  - Die Monate als Säulen in einer Karte.
- **Seite 2:**
  - «Jetzt essen» als Liste wie in der App: Emoji, Name, graue Zeile mit Menge und Ort, dieselben Badges («Nicht mehr essen», «heute», «morgen», «bis Mai 2027») aus `expiryBadge`.
  - Was im Kübel landet (mit Emoji) und warum.
  - Vorrat nach Ort und Einkäufe nach Laden.
- **Danach:** «Alles im Vorrat» als dieselbe Liste mit Wert. Sie beginnt auf einer eigenen Seite, wenn sonst verwaiste Zeilen entstehen.
- **Bilder vom Gerät:**
  - `pdf-assets.ts` zeichnet das App-Symbol (`icon.svg`, offline im Service Worker) und die Emoji mit der Emoji-Schrift des Geräts. Auf dem iPhone sind es also dieselben Apple-Emoji wie in der App.
  - Es wird nichts aus dem Netz geladen. Ohne Canvas (Tests) zeichnet der Bericht ohne Bilder.
- **Datumsart im Bericht:** Die Artikel tragen jetzt `expiryKind` (optional in der Schnittstelle, abwärtskompatibel), damit der Bericht wie die App «Nicht mehr essen» sagen kann.
- **Technik:**
  - Vektor mit jsPDF über `features/reports/pdf-kit.ts`.
  - `jspdf-autotable` fällt weg, die Listen zeichnet der Bericht selbst.
  - Lange Texte werden mit «…» gekürzt, nie angeschnitten.
- **Test:** `report-pdf.test.ts` zeichnet den erfundenen WG-Halbjahresbericht aus `report-sample.ts`; `REPORT_PDF_OUT=… pnpm vitest run report-pdf` legt ihn als Datei ab.
- Im Bericht heisst es «Quittungen» statt «Bons» (Glossar).

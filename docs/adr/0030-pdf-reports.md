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

## Nachtrag (8.11.2026): Seite 1 ist eine Quittung

Alban: «Cool wäre, wenn mein PDF auch wie eine Quittung aussieht: So hast du Food Waste reduziert, so viel wurde entsorgt, so viel weggegeben. Es sollte halt einen Premium-Feel haben.»

- **Seite 1** ist eine Rettich-Quittung auf silbernem Grund:
  - weisses Papier mit gezackten Abrisskanten und weichem Schatten, so lang wie sein Inhalt und mittig auf der Seite;
  - oben das Logo und «Wirf kein Geld in den Kübel.», darunter «So hast du Food Waste reduziert» mit Haushalt, Zeitraum und Datum;
  - Posten in Schreibmaschinenschrift (Courier): Gerettet, Weitergegeben (in «Gerettet» enthalten), Entsorgt, Im Vorrat, Eingekauft;
  - zwischen Doppellinien Rettungsquote und «Total gerettet»;
  - unten ein dekorativer Strichcode, der nichts enthält, und «Danke fürs Retten.».
- Die Seite lässt sich allein teilen. Onyx-Karte und Kacheln fallen weg, ihre Zahlen stehen auf der Quittung.
- **Ab Seite 2** folgt «Dein Bericht» mit «Was auffällt», «Pro Monat», «Jetzt essen», «Was im Kübel landet», «Vorrat und Einkäufe» und «Alles im Vorrat». Ein Abschnitt beginnt nur dann auf einer neuen Seite, wenn er nicht mehr ganz passt.
- **Kern:** Der Bericht kennt neu `sharedRappen` und `sharedCount`, also den geretteten Teil, der weitergegeben statt gegessen wurde. Wer frische Ware verschenkt, ist grosszügig, rettet aber nichts (ADR-0033).

## Nachtrag (8.11.2026): Berichtsarten, Quittung und ausführlicher Bericht getrennt

Alban: «Die Quittung ist wie ein einzelner PDF-Export, quasi ein Quick Summary. Das andere ist ausführlicher. Es sollte verschiedene Kategorien von Berichten geben … Die Quittung ist sexy und cool, aber das grosse Summary darf die Quittung dann nicht zeigen. Also quasi eigene Report- bzw. PDF-Sprache.»

- **Sieben Berichtsarten** unter «Berichte als PDF», gewählt mit Chips. Unter der Wahl steht in einem Satz, was kommt.
  - Als **Quittung** (Kurz-Bericht, eine Seite, wenn es passt):
    - **Wirkung:** die bisherige Quittung;
    - **Läuft bald ab:** 1, 3 oder 7 Tage oder eine eigene Zahl von 1 bis 60, Abgelaufenes eingeschlossen;
    - **Weggeworfen:** jeder Artikel mit Datum, Grund und Wert, dazu Anzahl, Gewicht und Total;
    - **Kühlschrank**, **Tiefkühler**, **Vorrat:** alles an diesem Ort mit Menge, Datum und Wert.
  - **Ausführlich:** der ganze Bericht mit Diagrammen und Listen, ohne Quittung.
- **Zeitraum** gibt es nur, wo er zählt: bei Wirkung, Weggeworfen und Ausführlich. Die anderen zeigen den Stand heute.
- **Zwei Sprachen, sauber getrennt:**
  - Die Quittung bleibt Papier, Courier, Doppellinien und Strichcode. Ist eine Liste länger als eine Seite, läuft sie auf weiteren Papierstücken mit «… Fortsetzung» weiter; nichts wird abgeschnitten.
  - Der ausführliche Bericht hat einen eigenen Kopf wie die App: Symbol und «Rettich» links, das Datum rechts, eine Haarlinie, darunter gross «Dein Bericht».
- **Technik:**
  - `receipt-spec.ts` legt rein fest, was auf einer Quittung steht, und ist ohne Zeichnen getestet.
  - `receipt-pdf.ts` zeichnet jede Quittung.
  - Seitenmasse und Fusszeile liegen gemeinsam in `pdf-kit.ts`.
- **Kern:** Der Bericht liefert neu `impact.wastedItems`, das Weggeworfene einzeln, neuestes zuerst. Ohne Produktnamen steht der Name der Kategorie.
- **Dateinamen:** `rettich-bericht-JJJJ-MM-TT.pdf` für den ausführlichen Bericht, `rettich-quittung-<art>-JJJJ-MM-TT.pdf` für die Quittungen.

## Nachtrag (8.11.2026): die Onyx-Karte kehrt zurück

Alban zum früheren Entwurf: «Ich liebe das Schwarze im Dashboard, gibt Premium-Look. Und die Kreise ein Augenschmaus.»

- Seit die Quittung ein eigener Kurz-Bericht ist, hat der ausführliche Bericht wieder Platz für die Übersicht.
- Unter «Dein Bericht» stehen wieder:
  - die Onyx-Karte mit dem geretteten Betrag;
  - der Satz «hast du vor dem Abfall gerettet.»;
  - die Rettungsquote als Ring in Smaragd;
  - darunter drei gleich grosse Kacheln: Im Vorrat, Weggeworfen, Eingekauft.
- Danach folgt «Was auffällt». «Pro Monat» beginnt auf Seite 2, damit kein Diagramm zerschnitten wird.
- `ring` ist zurück in `pdf-kit.ts`, mit Test.

## Nachtrag (8.11.2026): Zeiträume wie ein Kontoauszug

Alban: «Report per Wunschdatum oder von–bis … Schmeiss das 1 Monat, 3 Monate, 1 Jahr weg … Monatliche Reports per 31./30. nach Schweizer Bankwerktagen.» Rückfrage per Auswahl, beim Stichtag gewählt: «Letzter Bankwerktag».

- **Statt** «Dieser Monat / Letzte 3 Monate / Dieses Jahr» gibt es bei Wirkung, Weggeworfen und Ausführlich drei Wege:
  - **Monat:** Monatsabschluss, die letzten 24 Monate. Der laufende Monat steht zuoberst («November 2026 · bis heute»).
  - **Jahr:** Jahresabschluss, das laufende und die zwei Jahre davor.
  - **Von – bis:** zwei Datumsfelder, beliebiger Zeitraum bis heute. Sie zeigen immer TT.MM.JJJJ, unabhängig von der Sprache des Geräts. Alban: «Ich will 31.10.2026, nicht 10/31/2026, Schweizer Standard.» Der Kalender-Knopf öffnet das Datumsrad des Geräts (`ui/CalendarButton.tsx`, gemeinsam mit dem Ablaufdatum).
- **Stichtag:** Ein Monat schliesst am letzten Schweizer Bankwerktag. Der nächste beginnt am Tag danach. So zählt jeder Tag genau einmal, wie auf einem Kontoauszug. Beispiele:
  - Samstag 31.10.2026: Der Oktober schliesst per Fr 30.10. und der Samstag gehört zum November.
  - 31.12.2023 war ein Sonntag: 2023 schloss per 29.12. und das Jahr 2024 beginnt am 30.12.2023.
- **Bankwerktage:** Montag bis Freitag ohne die Bankfeiertage des Schweizer Zahlungsverkehrs (SIX Interbank Clearing, SIC). Das sind 1.1., 2.1., Karfreitag, Ostermontag, 1.5., Auffahrt, Pfingstmontag, 1.8., 25.12. und 26.12. Der 24.12. und der 31.12. sind dort Valutatage, also Bankwerktage. Kantonale Feiertage zählen nicht. Ostern wird berechnet (Meeus/Jones/Butcher), es gibt keine Tabelle, die veraltet.
- **Technik:**
  - `packages/core/src/reports/closing.ts`: `swissBankHolidays`, `isSwissBankDay`, `monthClosingDay`, `closingMonth`, `closingYear` und `closingMonthOf`. Rein, ohne Browser.
  - `features/reports/report-period.ts`: die Auswahl mit ihren Texten.
  - `PeriodPicker.tsx`: die Bedienung.
- **Verlauf:** Der Verlauf behält vorerst seine drei Zeiträume. Ob er auch Abschlüsse bekommt, entscheidet Alban.

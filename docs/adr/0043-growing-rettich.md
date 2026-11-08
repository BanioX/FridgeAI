# ADR-0043: Der wachsende Rettich auf Start, mit «Vorbild» als Meilenstein

- **Status:** angenommen
- **Datum:** 2026-11-08
- **Entscheid von:** Alban («Rettich wächst ist cool», «Vorbild?»), Umsetzung Claude

## Kontext

ADR-0042 gibt jeder bestätigten Rettung sofort eine nüchterne Rückmeldung. Was fehlte, ist ein Bild, das über den Monat wächst und beim Öffnen von Start zeigt, wo du stehst. Alban fand die Idee «Rettich wächst» gut und schlug «Vorbild» als Stufe vor.

## Entscheid

1. **Auf Start** zeigt «Deine Wirkung diesen Monat» oben eine Kachel im Smaragd des App-Symbols mit «Dein Rettich», der Stufe und «3 Rettungen diesen Monat · noch 3 bis Rettich».
2. **Ein Blatt pro bestätigter Rettung** im Monat, höchstens sieben. Mit jeder Stufe wird der ganze Rettich grösser.
3. **Stufen nach Rettungen im Monat:**

   | Stufe | ab |
   | --- | --- |
   | Samen | 0 |
   | Keimling | 1 |
   | Jungpflanze | 3 |
   | Rettich | 6 |
   | Vorbild | 10 |

   «Vorbild» hat eine Onyx-Kachel mit Silberrand, wie die schwarze Karte im ausführlichen Bericht.
4. **Jeden Monat neu:** Der Rettich zählt dieselben Rettungen wie die Karte (`stats.waste`, nur bestätigte, ADR-0039) und beginnt im neuen Monat wieder als Samen. So bleibt das Ziel erreichbar, und ein schwacher Monat zieht nicht ewig nach.
5. **Das neueste Blatt** wächst beim Öffnen sichtbar aus der Krone, nur ohne «Bewegung reduzieren».
6. **Kein Lob im Text:** Stufe und Zahlen, keine Ausrufezeichen (ADR-0042).
7. **Barrierefreiheit:** Das Bild hat einen Namen wie «Dein Rettich: Keimling, 1 Blatt». Der Text daneben sagt dasselbe für alle.

## Folgen

- Die Stufen sind eine reine Ableitung (`growthOf`), es wird nichts gespeichert.
- Die Schwellen sind für den Pilot geschätzt. Passen sie nicht, ändert sich nur `growth.ts`.
- Später denkbar (Ideen): «Vorbild» der letzten Monate als kleine Reihe, ein Rettich pro Person im Haushalt.

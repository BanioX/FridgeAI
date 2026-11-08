# ADR-0037: Namen der Läden in der App, und «Quittung» statt «Bon»

- **Status:** angenommen
- **Datum:** 2026-11-07
- **Entscheid von:** Claude, auf Albans Frage; Alban kann ihn jederzeit ändern

## Kontext

Alban (7.11.2026): «Die Schweizer sagen Quittung statt Bon.» Und zur Seite «Quittung hochladen»: «Dürfen wir sagen ‹Lade die Quittung von Coop, Migros etc. hoch›? Dürfen wir deren Namen erwähnen?»

Die Namen helfen dir, weil sie sagen, woher die Datei kommt: das PDF aus der Coop- oder Migros-App, der Screenshot aus Lidl Plus. Die Namen sind aber Marken der Händler.

## Entscheid

1. **In der App steht «Quittung»**, nie «Bon» oder «Kassenbon». Ein Test prüft den Textkatalog (`messages.test.ts`), das Glossar führt die Begriffe anderer Regionen (de-DE «Kassenbon», de-AT «Kassabon»).
2. **Namen der Läden nur als schlichter Text und nur dort, wo sie sagen, woher eine Datei oder ein Preis kommt:**
   - beim Hochladen («das PDF aus der Coop- oder Migros-App»),
   - beim erkannten Laden einer Quittung,
   - im Preis-Gedächtnis und im Bericht («Eingekauft nach Laden»).
3. **Nie:**
   - Logos, Farben oder Schriften der Händler;
   - «Partner», «offiziell» oder etwas, das eine Verbindung andeutet;
   - Namen in Werbung, App-Store-Text oder Domain.
4. **Ein kurzer Hinweis** auf der Seite «Quittung hochladen»: «Coop, Migros und Lidl Plus sind Marken ihrer Inhaber. rettich ist mit ihnen nicht verbunden.»

## Begründung

Eine Marke zu nennen, um zu beschreiben, wofür etwas passt oder woher es kommt, ist in der Schweiz und in der EU grundsätzlich zulässig, solange es nötig ist und keine Verbindung vortäuscht. Das gilt markenrechtlich und nach dem Gesetz gegen den unlauteren Wettbewerb (UWG). Schlichter Text ohne Logo und mit Hinweis bleibt deutlich auf der sicheren Seite.

Das ist keine Rechtsberatung. **Vor dem ersten Marketing** (App Store, Website, Pitch mit Screenshots) prüft eine Fachperson die Texte, zusammen mit der eigenen Marke (Parkplatz P8).

## Folgen

- Eine Partnerschaft (P1) würde Logos und gemeinsame Auftritte erst mit Vertrag erlauben.
- Neue Texte mit Händlernamen folgen diesen Regeln. Fragen dazu entscheidet Alban.

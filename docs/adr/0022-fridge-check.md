# ADR-0022: Kühlschrank-Check mit vier Antworten

- **Status:** angenommen
- **Datum:** 2026-11-06

## Kontext

UC-04 und Plan-Schritt 6c sehen einen «30-Sekunden-Kühlschrank-Check» vor. Einmal pro Woche geht die Person die Karten durch: «noch da / weg / halb». Der Vorrat bleibt nur nützlich, wenn er stimmt. Im Pilot zählt der Kühlschrank zuerst (Alban, 6.11.2026).

## Entscheid

- **Vier Antworten pro Artikel:**
  - «Noch da»: keine Änderung, kein Event.
  - «Halb»: die Hälfte gilt als gegessen.
  - «Gegessen»: alles gegessen.
  - «Weggeworfen»: alles weggeworfen, ohne Grund, weil der Check schnell bleiben soll.
- **Gegessen statt «weg»:** «Weg» allein wäre mehrdeutig. Die Wirkungs-Karte braucht die Unterscheidung zwischen gerettet und weggeworfen. Deshalb gibt es zwei Antworten.
- **«Halb» zählt als gegessen.** Wer genauer sein will, nutzt die Detailseite. `halfOf` im Core rechnet so:
  - Gramm und Milliliter auf ganze Einheiten;
  - Stück auf Viertel abgerundet, damit eher zu viel im Vorrat bleibt als zu wenig;
  - unter 20 g/ml oder bei einem Viertel Stück ist «Halb» nicht wählbar.
- **Keine neue Operation:** Der Check nutzt `inventory.recordOutcome` und für «Zurück» `inventory.undoOutcome`. So zählen Wirkungs-Karte und Export automatisch mit, und REST oder MCP brauchen nichts Neues.
- **Reihenfolge:** nur Artikel im Kühlschrank, das nächste Datum zuerst. Die Liste wird beim Start festgehalten, damit jeder Artikel genau einmal kommt.
- **Wann:** Die Karte auf «Heute retten» erscheint, wenn im Kühlschrank etwas liegt und der letzte Check auf diesem Gerät mindestens 7 Tage her ist.
  - Das Datum liegt in `localStorage` und betrifft nur dieses Gerät, ohne Personenbezug.
  - Mit Konten (Schritt 7) kann es in den Haushalt wandern.

## Konsequenzen

- Der Vorrat bleibt mit wenig Aufwand aktuell, und Fehler lassen sich mit «Zurück» sofort korrigieren.
- «Halb» ist eine Schätzung. Die Wirkungs-Karte zählt sie wie eine echte Portion.
- Wischgesten statt Knöpfen sind hier nicht gebaut.

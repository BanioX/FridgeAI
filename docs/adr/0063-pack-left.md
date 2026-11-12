# ADR-0063: Packung: was übrig ist

- **Status:** angenommen
- **Datum:** 2026-11-12
- **Entscheid von:** Claude, auf Albans Frage

## Kontext

Alban: «Bei Schmelzkäse hat eine Packung 10 Stück, also 10 Scheiben. Dafür auch eine Kreis-Logik?» Wer eine Scheibe nach der anderen verwertet (ein Wisch in der Liste nimmt ein Stück, «−1»), sieht nur noch «7 Stk.» und nicht mehr, wie viel von der Packung schon weg ist.

## Entscheid

1. **Berechnet, nicht gespeichert.** Der Anfang der Packung ist, was übrig ist, plus was schon wegging (verwertet, entsorgt, verarbeitet). `inventory.list` liefert dazu pro Artikel `takenQuantity` (Summe der nicht rückgängig gemachten Einträge im Journal). `packLeft` im Kern macht daraus «7 von 10». So stimmt es auch nach einer Korrektur der Menge und für alte Artikel.
2. **Nur für Stück**, ab einer Packung von zwei. Gramm und Milliliter sagen es schon in der Menge.
3. **Ein Ring wie ein angeschnittener Kuchen:** ein Abschnitt pro Stück, mit kleinen Lücken, in Tinte; in der Mitte, was übrig ist (auch «9½» nach «Halb»). Ab 25 Stück ein geschlossener Bogen. So sieht er nie wie der Haltbarkeits-Ring daneben aus (eine Zahl von 10, farbig nach heikel bis robust).
4. **Auf der Artikelseite** in der Karte mit dem Datum, unter der Haltbarkeit: «7 von 10 übrig», darunter «3 schon verwertet oder entsorgt» oder «Ganze Packung».

## Folgen

- `inventory.list` liest dafür die Einträge des Haushalts einmal mit; die Liste bleibt eine Abfrage.
- Ein Artikel, der beim Verschieben geteilt wurde, beginnt mit dem geteilten Teil.
- In der Liste steht weiter nur die Menge; ein Ring pro Zeile wäre zu unruhig (`docs/flaechen.md`).
- «Wissen» erklärt den Ring unter «Rettich im Alltag».

## Nachtrag (12.11.2026): Kategorie «Käsescheiben»

Damit Schmelzkäse von Anfang an in Scheiben zählt, gibt es die Kategorie **Käsescheiben** (`dairy-cheese-slices`): Schmelzkäse, Toastkäse, Scheibletten, Sandwich- und Burgerkäse. Sie zählt in Stück (eine Scheibe), bietet beim Erfassen die Packungsgrössen «8er», «10er» und «12er» und teilt eine Scheibe nicht weiter. Preis und Gewicht gelten pro Scheibe (rund 30 Rappen, 20 g; L-27). Offen hält sie etwa 5 Tage. Für die Klimabilanz steht wie bei Hartkäse der Cheddar. Quittungszeilen mit «Schmelzkäse» finden die Kategorie über ihr Stichwort.

## Nachtrag (12.11.2026): Der Ring lässt sich bedienen

Alban: «Wie wird das Stück-Rad getriggert? Es muss ein smartes Menü sein, eine Funktion wie antippen oder rückgängig.»

- **Antippen** des Rings: ein Stück verwertet (`inventory.recordOutcome`, Menge 1 oder der Rest eines halben Stücks). Neben dem Ring steht «1 Stück verwertet.» mit «Rückgängig» (`inventory.undoOutcome`), bis die nächste Aktion kommt; danach «Zurückgelegt.».
- **Lang drücken** (oder Rechtsklick) öffnet ein Menü: «1 Stück verwertet», «1 Stück entsorgt», «Letzte rückgängig», «Abbrechen». Für Tastatur und Bildschirmleser öffnet der Knopf «⋯» («Mehr zur Packung») dasselbe Menü; der Ring selbst ist ein Knopf mit «Packung: 7 von 10 übrig. Tippen: 1 Stück verwertet.».
- **Das letzte Stück** schliesst den Artikel wie sonst auch: zurück zur Liste, dort mit «Rückgängig».
- Ein Antippen fragt nicht nach «Gerettet» (wie das Wischen in der Liste). Wer das bestätigen will, nimmt «Was ist damit passiert?» weiter unten.
- Unter dem Ring steht der Hinweis «Tippen: 1 Stück verwertet · Halten: mehr».

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

# ADR-0028: Bon importieren und speichern

- **Status:** angenommen
- **Datum:** 2026-11-07

## Kontext

Alban (7.11.2026): «Ich wäre froh, wenn man uploaden könnte und es dann den Upload ausliest. Die Foodfacts sind für den Anfang sekundär, der Preis ist wichtig. Einfach Name des Produkts.»

Der Bon-Leser (ADR-0027) liefert Zeilen mit Name, Menge, Preis und Rabatt. Für ein späteres Preisgedächtnis braucht es auch Laden und Datum. Diese Angaben gehen verloren, wenn nur Artikel im Vorrat landen.

## Entscheid

- **Neuer Command `receipts.import`** (Vertrag v1, 25 Operationen).
  - Die Oberfläche schickt den geprüften Bon: Händler, Filiale, Kaufzeit, Total und die Zeilen.
  - Jede Zeile trägt Name, Art, Menge, Stückpreis, Preis, Rabatt und «Lebensmittel ja/nein».
  - Eine Zeile mit `location` kommt in den Vorrat.
- **Gespeichert wird auf dem Gerät** (Dexie Version 5, Tabellen `receipts` und `receiptLines`):
  - Laden, Kaufzeit und Total.
  - Pro Zeile Name, Menge, Preis und Rabatt.
  - **Nie** das Foto, das PDF oder der Rohtext. Darauf stehen Karten- und Kundennummern.
- **Der Vorrat bekommt den bezahlten Preis** (Preis minus Rabatt) und einen Verweis auf die Bonzeile. So zählt der Wert im Kühlschrank und beim Wegwerfen den echten Preis.
- **Kein Bon doppelt:** Die Oberfläche schickt einen SHA-256-Hash des Bontexts mit. Ein zweiter Import desselben Bons ändert nichts und meldet `duplicate`.
- **Export und Löschen** umfassen die Bons (ADR-0020).

## Konsequenzen

- Das Preisgedächtnis pro Produkt (zuletzt bezahlt, üblicher Preis, günstigster Laden) kann direkt aus `receiptLines` rechnen.
- Später teilt die Kostenteilung (Schritt 9) dieselben Zeilen auf die Mitbewohner:innen auf.
- Der Upload in der Oberfläche (PDF zuerst, dann Fotos) folgt im nächsten PR.

# ADR-0072: Mehrere auf einmal erfassen

- **Status:** angenommen
- **Datum:** 2026-11-13
- **Entscheid von:** Claude, auf Albans Wunsch nach mehr sinnvollen Funktionen

## Kontext

Nach dem Markt, der Bäckerei oder dem Hofladen gibt es oft keine Quittung und keinen Strichcode. Bisher blieb nur, jeden Artikel einzeln zu erfassen. Die Einkaufsliste kann aber schon einen Satz wie «3 Äpfel, Salat, 500 g Rüebli, Milch» in einzelne Zeilen zerlegen (K14).

## Entscheid

1. **Neue Seite «Mehrere auf einmal»** unter `/add/batch`, erreichbar über eine Kachel auf «Erfassen». Ein Textfeld, darunter eine Vorschau mit Name, Menge, Bild der Kategorie, Lagerort und geschätztem Ablaufdatum. Jede Zeile lässt sich entfernen.
2. **Kein zweiter Parser:** Der Satz wird mit `parseShoppingText` gelesen, dem Parser der Einkaufsliste. Kategorie, Lagerort, Menge und Datum kommen aus denselben Hilfen wie im Einzelformular (`matchCategoryByName`, `fallbackCategory`, `suggestedAmount`, `suggestedExpiry`). Unbekanntes kommt in den Kühlschrank. Die Zeilen entstehen in einer reinen Funktion (`batch-rows.ts`).
3. **Ein Knopf, ein Command pro Zeile:** «n Artikel in den Vorrat» ruft `inventory.addItem` einmal pro Zeile mit eigener `commandId` auf, ohne `expiresOn`; der Handler schätzt das Datum wie im Einzelformular. Danach geht es zu «Einräumen» wie nach der Quittung. Bei einem Fehler bleibt der Text stehen, ein zweiter Versuch nutzt dieselben `commandId`s und legt nichts doppelt an.
4. **Diktieren ist das der Tastatur:** Das Mikrofon der Tastatur funktioniert in jedem Textfeld. Rettich nutzt keine Sprach-Schnittstelle und hört nie selbst zu.

## Folgen

- Nichts verlässt das Gerät: kein Dienst, keine Produktsuche, die Auswertung des Satzes läuft lokal.
- Die Vorschau zeigt nur, was die Seite schätzt. Preis, Besitzer, Packungsgrösse und ein gedrucktes Datum gibt es hier nicht; dafür bleibt das Einzelformular, und auf der Artikelseite lässt sich alles korrigieren.
- Ein falsch erkannter Name führt zu einer falschen Kategorie. Die Vorschau macht das vor dem Speichern sichtbar; entfernen und einzeln erfassen löst es.
- Gleiche Produkte im selben Satz fasst der Parser zusammen, wie auf der Einkaufsliste.

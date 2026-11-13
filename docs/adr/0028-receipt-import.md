# ADR-0028: Bon importieren und speichern

- **Status:** angenommen
- **Datum:** 2026-11-07

## Kontext

Alban (7.11.2026): «Ich wäre froh, wenn man uploaden könnte und es dann den Upload ausliest. Die Foodfacts sind für den Anfang sekundär, der Preis ist wichtig. Einfach Name des Produkts.»

Der Bon-Leser (ADR-0027) liefert Zeilen mit Name, Menge, Preis und Rabatt. Für ein späteres Preisgedächtnis braucht es auch Laden und Datum. Diese Angaben gehen verloren, wenn nur Artikel im Vorrat landen.

## Entscheid

- **Neuer Command `receipts.import`** (Schnittstelle v1, 25 Operationen).
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

- **Fotos und Screenshots** (z. B. Lidl Plus) liest tesseract.js auf dem Gerät.
  - Engine, Worker und das deutsche Modell (tessdata «best_int», Apache-2.0) liegen auf unserem eigenen Server (`/ocr/deu.traineddata`), nie auf einem CDN.
  - Alles wird erst geladen, wenn ein Bild gewählt ist. Die Engine (etwa 4 MB) wird beim ersten Mal zwischengespeichert, nicht schon bei der Installation.
  - Kleine Screenshots werden vergrössert. Das Bild wird nie gespeichert.
  - Typische Fotofehler fängt der Leser ab: ein Rabatt ohne Minus, «-6.13» statt «-0.13» unter einem 2.95-Artikel, «6.99» über «2 x 3.45». Was bleibt, zeigt die Summenprüfung.

## Konsequenzen

- Das Preisgedächtnis pro Produkt (zuletzt bezahlt, üblicher Preis, günstigster Laden) kann direkt aus `receiptLines` rechnen.
- Später teilt die Kostenteilung (Schritt 9) dieselben Zeilen auf die Mitbewohner:innen auf.
- Der Upload in der Oberfläche (PDF zuerst, dann Fotos) folgt im nächsten PR.

## Ergänzung 13.11.2026: Einzeln durchgehen

Ticket #42. Die Liste bleibt der schnelle Weg. Daneben steht ein zweiter Knopf, «Einzeln durchgehen», der die Lebensmittelzeilen als Karten zeigt («3 von 8»):

- **Eine Karte pro Lebensmittelzeile** aller einbezogenen Quittungen, Quittung für Quittung. Die Karte zeigt Name, Menge, Laden und den Treffer von Open Food Facts (derselbe «Ja/Nein»-Block wie in der Liste), dazu Ort, Datum und Preis.
- **Derselbe Zustand wie die Liste.** Die Karten ändern den `Review` der Quittung: «Übernehmen» und «Nicht in den Vorrat» setzen oder lösen das Häkchen, ein neuer Preis läuft durch `withPrice`, Ort und Datum stehen neu in `Review.overrides`. Die Liste zeigt jede Wahl sofort.
- **Ort** wie bisher vorbelegt (`matchCategoryByName(name) ?? fallbackCategory()`, dessen `defaultLocation`). **Datum** ist der Vorschlag aus der Haltbarkeit der Kategorie am gewählten Ort (`suggestedExpiry`, dieselbe Rechnung wie im Formular «Artikel hinzufügen»). Wechselt der Ort, gilt wieder der Vorschlag für den neuen Ort.
- **Schnittstelle:** `ReceiptImportLineSchema` hat neu das optionale Feld `expiresOn`. Es wird nur gesendet, wenn die Person ein Datum gewählt oder getippt hat und geht unverändert an `inventory.addItem`. Ohne das Feld rechnet der Import wie bisher.
- **Ein Importweg.** Am Ende zeigt die letzte Karte «6 übernommen, 2 weggelassen», darunter eine Übersicht (Übernommenes zuerst, mit Ort, «bis …» und Preis; Weggelassenes durchgestrichen; ein Tipp führt zurück zur Karte) und denselben Knopf wie die Liste (`takeAll`). Die `commandId` pro Quittung bleibt fest, ein Wiederholen importiert nichts doppelt.
- **Offen:** Wischen zum Weiterschalten fehlt bewusst, die Knöpfe genügen. Eine Karte für eine Zeile, die in der Liste schon abgewählt war, legt sie mit «Übernehmen» wieder in den Vorrat.

# ADR-0036: Bon mit Open Food Facts abgleichen

- **Status:** angenommen
- **Datum:** 2026-11-07
- **Entscheid von:** Alban («Ein Tipp pro Bon»)

## Kontext

Alban: «Der ausgelesene Bon soll zur Datenbank von Open Food Facts passen.» Ein Bon nennt Produkte so, wie die Kasse sie druckt («Naturaplan Bio Coconutwater 1L»). Open Food Facts kennt sie mit Barcode, Marke, Packungsgrösse, Nährwerten und Bild. Bisher gingen nur Barcodes und selbst getippte Wörter an Open Food Facts (ADR-0016, Datenschutzerklärung). Der Abgleich ist ein neuer Datenfluss, darum hat Alban gewählt:

- **Ein Tipp pro Bon** (gewählt): Nach dem Auslesen tippst du «Mit Open Food Facts abgleichen».
- Automatisch nach dem Auslesen (verworfen: die Namen gingen jedes Mal raus).
- Offline-Katalog mit Schweizer Auszug (verworfen: mehrere MB, ODbL-Pflichten, wöchentliche Updates).

## Entscheid

- **Was rausgeht:** nur die bereinigten Produktwörter einer Zeile. Packungsgrössen, Mengen, Preise, Laden, Datum und Uhrzeit bleiben auf dem Gerät. Gesucht werden nur Zeilen, die du in den Vorrat übernehmen willst.
- **Zuerst lernen, dann fragen:** Hast du dieselbe gedruckte Zeile schon einmal bestätigt, kennt rettich das Produkt aus früheren Bons, ohne Netz.
- **Suche:** zuerst die Wörter wie gedruckt. Findet das nichts, ein zweiter Versuch ohne Hausmarke und «Bio» (Coop, Naturaplan, M-Budget …).
- **Bewertung (rein, in `packages/core/src/receipt/off-match.ts`):**
  - Gezählt wird, wie viele Wörter Bon und Treffer teilen (Dice-Koeffizient).
  - Einen Zuschlag gibt es, wenn alle Produktwörter vorkommen und die Packungsgrösse gleich ist. Eine andere Grösse gibt einen Abzug.
  - «sicher» heisst: deutlich vor dem zweitbesten Treffer und gleiche Packungsgrösse. Sonst ist es ein «Vorschlag».
- **Bestätigen:** Du bestätigst jeden Treffer. Erst dann bekommt der Artikel Name, Barcode und Produktdaten von Open Food Facts. Die Bon-Zeile behält den gedruckten Namen.
- **Grenzen von Open Food Facts:** Die Suche erlaubt etwa 10 Anfragen pro Minute. Die App fragt Zeile für Zeile, wartet wenn nötig und zeigt den Fortschritt.
- **Schnittstelle:**
  - Neue Abfrage `receipts.matchLine` (nur der Name, keine weiteren Daten).
  - `receipts.import` bekommt pro Zeile optional `gtin` und `productName`.
  - Der Anwendungsfall liegt in der Logikschicht (`application/receipt-match.ts`, ADR-0034).

## Konsequenzen

- Bessere Namen, Barcodes und Bilder im Vorrat. Gleiche Produkte aus verschiedenen Bons landen beim selben Produkt, so wird das Preisgedächtnis genauer.
- Die Datenschutzerklärung bekommt eine Zeile für den Abgleich, sobald der Knopf in der App ist.
- Frische Ware ohne Barcode (Bananen, Rüebli) findet selten einen guten Treffer. Sie bleibt, wie sie ist.

## Nachtrag 7.11.2026: automatisch, Ja/Nein, Barcode pro Zeile

Alban hat den Abgleich am Handy getestet («Bon auslesen ist 10/10») und entschieden:

- **Automatisch:** Der Abgleich startet direkt nach dem Auslesen, ohne Tipp. Es gehen weiterhin nur die Produktwörter der gewählten verpackten Lebensmittel raus. Die Zeile «Nur die Produktnamen gehen an Open Food Facts …» steht in der Bon-Ansicht, die Datenschutzerklärung ist angepasst.
- **«Ist es das?» mit «Ja» und «Nein»** statt «Passt». Nur «Ja» übernimmt das Produkt. Bekannte Zeilen aus früheren Bons sind schon bestätigt.
- **Klarer Fortschritt:** «Prüfe 8 von 10 … · 2 gefunden». Das Warten kommt von der Grenze bei Open Food Facts.
- **Barcode pro Zeile:** Ohne Treffer oder nach «Nein» bietet die Zeile «Barcode scannen» an. Ein gescannter Barcode gilt als bestätigt, denn die Person hält genau diese Packung in der Hand. Ein Hinweis nach dem Abgleich lädt ein, die übrigen Produkte zu scannen.
- **Weitere Datenquellen** (Open Food Repo, Händler, Foto der Nährwerttabelle): siehe [`../ideen/produktdaten.md`](../ideen/produktdaten.md).


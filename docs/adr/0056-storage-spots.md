# ADR-0056: Plätze mit Foto: wo ist was?

- **Status:** angenommen
- **Datum:** 2026-11-12
- **Entscheid:** Alban (Idee), Claude (Umsetzung)

## Kontext

Alban: «Eventuell auch Foto, wo habe ich was gelagert: Wenn du willst, schiess ein Foto, wo du deine Nudeln oder deinen Tee lagerst, weil ich z. B. manchmal nicht finde, wo meine Frau Zucker oder Dinge hingepackt hat.» Rettich kannte den Lagerort (Kühlschrank, Tiefkühler, Vorrat, Notvorrat), aber nicht, wo im Schrank etwas liegt.

## Entscheid

- **Plätze gehören zu Produkten, nicht zu Artikeln.** «Zucker liegt hier»; jede neue Packung erbt den Platz (`Product.spotId`).
- **Ein Platz gehört zu genau einem Lagerort** (`StorageSpot.location`). Die Zeile zeigt den Platz nur, wenn der Ort des Platzes dem aktuellen Lagerort des Artikels entspricht; nach dem Einfrieren bleibt der Vorratsplatz verborgen (`InventoryItemView.spot` ist dann `null`).
- **Schnittstelle** (Zod, `CONTRACT_V1`): `spots.list` (Abfrage), `spots.create`, `spots.update` (Name, Foto, `null` entfernt es), `spots.delete` (weiches Löschen, Produkte verlieren den Platz), `products.setSpot`. Ereignisse: `spot.created`, `spot.updated`, `spot.deleted`, `product.spot_set`.
- **Fotos bleiben auf dem Gerät:** verkleinertes JPEG als Data-URL (längste Seite 1280 px, Qualität 0.72, wenn nötig weniger), höchstens 450 000 Zeichen. Teil von `household.export` und `household.import`, `household.delete` entfernt sie (ADR-0020). Sie werden nirgends hin gesendet. Vorbild: `products.image` liefert ebenfalls eine Data-URL.
- **Kamera nur nach einem Tipp:** `<input type="file" accept="image/*" capture="environment">`; verweigert oder fehlt die Kamera, bietet der Browser die Fotoauswahl.
- **Seite «Wo ist was?»** unter «Mehr»: Suche im Vorrat über alle Lagerorte, darunter die Plätze nach Lagerort. Die Suche steht in der Adresse (`/more/spots?q=zucker`, `replace`), damit ein iPhone-Kurzbefehl «Wo ist der Zucker?» sie öffnen kann.

## Ehrlich zur Grenze

Es gibt noch keine Synchronisation (Meilenstein C). Bis dahin teilt ein Haushalt Plätze über dasselbe Gerät oder über Export und Import. Mit Konten ziehen Plätze und Fotos mit; dann braucht das Foto-Speichern einen eigenen Entscheid (Datenabfluss, Albans Freigabe).

## Folgen

- Eine neue Gerätefunktion in `docs/swelp/nebenwirkungen.md` (SE-25, Kamera/Fotoauswahl für Plätze).
- Schuld TD-21: Fotos liegen als Data-URL in IndexedDB, ohne Blob-Speicher und ohne weitere Kompression als die des Canvas.
- Eine Platzliste mit vielen Fotos wächst im Speicher (höchstens rund 450 KB je Foto).

## Nachtrag (12.11.2026): Platz für mehrere Artikel

«Ändern» im Auswahlmodus setzt auch den Platz (K11). Das Feld «Platz» erscheint nur, wenn alle gewählten Artikel am selben Lagerort liegen (der Platz gehört zu genau einem Lagerort): die Plätze dieses Orts und «Kein fester Platz». Hat der Ort noch keine Plätze, steht ein Hinweis statt des Feldes; neue Plätze entstehen weiter nur auf der Artikelseite oder unter «Wo ist was?». Weil der Platz am Produkt hängt, ruft «Ändern» `products.setSpot` einmal je Produkt auf, auch wenn mehrere Packungen gewählt sind; ein Fehler betrifft alle Packungen dieses Produkts und wird wie bei den anderen Feldern genannt.

## Nachtrag (12.11.2026): auch im PDF

Der Platz steht im Gesamtauszug hinter dem Namen («· Türfach») und in der Quittung für Kühlschrank, Tiefkühler und Vorrat in der Notiz; nur wenn er im Lagerort des Artikels liegt (`reports.build`, Feld `spot`).

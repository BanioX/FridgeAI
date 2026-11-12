# ADR-0059: Mindestbestand füllt Nachkaufen

- **Status:** angenommen
- **Datum:** 2026-11-12
- **Entscheid von:** Claude (Umsetzung der Idee M3 aus `docs/ideen/mitbewerber-apps.md`, gelernt von Grocy und Pantrist)

## Kontext

Wer immer Milch im Haus haben will, tippt sie heute jedes Mal selbst auf «Nachkaufen». Grocy und Pantrist lösen das mit einem Mindestbestand: «Milch: immer mindestens 1». Fällt der Vorrat darunter, steht das Produkt von selbst auf der Liste.

## Entscheid

1. **Feld am Produkt.** `Product.minStock`, eine ganze Zahl von 1 bis 20, gezählt in aktiven Artikeln (Packungen) dieses Produkts. Nicht in Gramm: einfach halten. Ohne Wert gibt es keinen Mindestbestand.
2. **Setzen.** Neuer Befehl `products.setMinStock` (`productId`, `minStock` als Zahl oder `null`), Ereignis `product.min_stock_set`. Die Artikelseite zeigt die Zeile «Immer da haben» mit «Aus», 1, 2, 3 und «mehr» (Zahl von 1 bis 20).
3. **Prüfung nach dem Abschluss.** Der gemeinsame Helfer `ensureMinStock` (`application/min-stock.ts`) läuft in derselben Befehls-Transaktion (Lektion L-01) nach `inventory.recordOutcome` und nach den Zutaten von `inventory.process`. Hat das Produkt weniger aktive Packungen als `minStock` und steht es nicht schon offen auf der Liste (gleiche `productId` oder gleicher Name), legt er eine Zeile an wie `shopping.addItem`: gleicher Name, `productId`, Kategorie, Ereignis `shopping_list.item_added`.
4. **Markierung.** Die Zeile trägt `source: 'min_stock'`; `shopping.list` gibt es weiter, und die Seite zeigt eine kleine Notiz «Mindestbestand».
5. **Rückmeldung.** `inventory.recordOutcome` antwortet mit `addedToList: true`, wenn eine Zeile entstand. Wisch-Toast, Status der Artikelseite und der Hinweis im Vorrat sagen «Steht jetzt auf «Nachkaufen».»
6. **Rückgängig entfernt die Zeile nicht wieder.** Bewusst einfach: Wer rückgängig macht, löscht den Eintrag bei Bedarf selbst. Ein automatisches Entfernen müsste prüfen, ob die Zeile inzwischen abgehakt oder eingekauft wurde.
7. **Export und Import.** `minStock` liegt am Produkt und `source` an der Zeile; beide gehen durch die bestehenden Schemas, ohne neuen Speicher-Schlüssel.

## Folgen

- **Schnittstelle v1:** eine neue Operation (`products.setMinStock`), ein neuer Ereignistyp (`product.min_stock_set`); `InventoryItemView` kennt `minStock`.
- **Datenrechte (ADR-0020):** kein neuer Datenfluss, nichts verlässt das Gerät.
- **Grenzen:** Gezählt werden Packungen, nicht Mengen; ein Teil-Abschluss ändert die Zahl der Packungen nicht, löst aber eine Prüfung aus (ist der Bestand schon unter dem Minimum, entsteht die Zeile dann). Löschen eines Artikels löst nichts aus (nur Abschlüsse).
- **Offen:** Mindestbestand in Mengen (zum Beispiel «mindestens 1 l»); Vorschlag beim Erfassen eines oft gekauften Produkts.
- **Verworfen:** Mindestbestand in Gramm (mehr Eingabe, kaum Nutzen für den Kühlschrank); Zeile bei Rückgängig wieder entfernen (siehe Punkt 6).

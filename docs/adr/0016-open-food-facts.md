# ADR-0016: Produktdaten zum Barcode – zuerst lokal, dann Open Food Facts

- **Status:** angenommen
- **Datum:** 2026-11-06

## Kontext

Nach dem Scan (ADR-0014) soll die App Name, Kategorie, Packungsgrösse und Nährwerte vorschlagen (Alban: «Scan muss diese Daten einfügen … Kalorien und Nährwerte»). Lokal kennt sie nur Produkte, die der Haushalt schon erfasst hat. Für neue Barcodes braucht es eine offene Datenbank. Dabei verlässt zum ersten Mal etwas das Gerät. Alban hat die Entscheidung delegiert («nimm die beste Entscheidung … darfst frei wählen», 6.11.2026).

## Entscheid

- **Reihenfolge:** zuerst die Produkte des Haushalts (Name und Kategorie, die die Person gewählt hat), dann **Open Food Facts** (kostenlos, offen, gute Abdeckung in der Schweiz).
- **Datensparsam:**
  - Gesendet wird nur die Barcode-Nummer, ohne Cookies, ohne Referrer und ohne Konto.
  - Angefragt werden nur die Felder, die FridgeAI braucht.
  - Nach 6 Sekunden oder offline gilt das Produkt als unbekannt. Das Erfassen geht immer weiter.
- **Vertrag:** neue Abfrage `products.lookup` (Scope `inventory:read`). Später beantwortet der Server dieselbe Anfrage für API und MCP.
- **Speichern:** Übernimmt die Person den Vorschlag, entsteht ein Produkt im Haushalt. Der nächste Scan desselben Barcodes braucht kein Netz mehr.
- **Cache:** Antworten von Open Food Facts merkt sich das Gerät 30 Tage lang (Tabelle `catalogCache`, Dexie-Version 2). Die Tabelle enthält nur öffentliche Produktdaten, ist keine Haushaltsdaten und wird nie synchronisiert. Ein erneuter Scan funktioniert dadurch offline, und eine alte Antwort ist besser als keine. Unbekannte Barcodes werden nicht gemerkt.
- **Beim Erfassen:** Das neue Produkt übernimmt Marke, Packungsgrösse, Nährwerte, Nutri-Score und Allergene aus dem Cache, mit `source: off`. Der Name bleibt der, den die Person gewählt hat.
- **Packungsbild** (Wunsch Alban, 6.11.2026):
  - Das kleine Frontbild (200 px) kommt einmal von `images.openfoodfacts.org`, im Hintergrund nach dem ersten Treffer. Dabei gelten dieselben Regeln wie bei der Abfrage: ohne Cookies, ohne Referrer, mit Zeitlimit.
  - Angenommen werden nur JPEG, PNG oder WebP unter 300 KB von genau diesem Server.
  - Das Bild bleibt als Data-URL auf dem Gerät (Tabelle `productImages`, Dexie-Version 4) und wird nie synchronisiert. Abrufbar ist es über die Abfrage `products.image`.
  - Lizenz der Bilder: CC BY-SA, die App nennt die Quelle.
- **Untrusted:** Die Antwort wird mit Zod geprüft (`parseOffProduct`). Unplausible Nährwerte werden verworfen, Steuerzeichen entfernt, Längen begrenzt.
- **Lizenz:** Die Daten stehen unter ODbL. Die App nennt «Daten: Open Food Facts» beim Vorschlag. Eigene Daten bleiben getrennt (ADR-0015).

## Konsequenzen

- Die CSP erlaubt `connect-src https://world.openfoodfacts.org`. Das kommt mit der Oberfläche in Schritt 10b.
- In der Datenschutzerklärung (vor dem Release) wird Open Food Facts als Empfänger der Barcode-Nummer genannt.
- Später möglich: Open Food Repo (Schweiz, mit API-Schlüssel), Händler-Kataloge über Partner, alle über den Port `ProductCatalog`.

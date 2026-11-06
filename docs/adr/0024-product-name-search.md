# ADR-0024: Produkte nach Namen suchen («Coop Gipfeli»)

- **Status:** angenommen
- **Datum:** 2026-11-06

## Kontext

Alban (6.11.2026): «Bei Yazio kann ich z. B. Coop Gipfeli eingeben, dann findet es das. Kann ich das auch haben?» Bisher fand FridgeAI Produktdaten nur über den Barcode (ADR-0016). Yazio nutzt eine eigene, nicht öffentliche Datenbank (`ideen/scan-und-produktdaten.md`).

Getestet am 6.11.2026 mit Open Food Facts:
- Die klassische Suche `world.openfoodfacts.org/cgi/search.pl` erlaubt Aufrufe aus dem Browser (CORS `*`) und verlangt alle Wörter.
- Mit dem Länderfilter Schweiz findet «weggli» «Petits pains Weggli (Coop, 300 g)», «Weggli (M-Classic)» und «Butterweggli (Migros)». «coop gipfeli» findet «Vanille Gipfeli (Coop Betty Bossi)».
- Nicht jedes Coop-Produkt ist erfasst.
- Die neuere Suche `search.openfoodfacts.org` sendet keine CORS-Kopfzeilen und ist aus der App nicht nutzbar.
- Grenze laut Dokumentation: 10 Suchen pro Minute und Person.

## Entscheid

- **Neue Query `products.search`:** zuerst die eigenen Produkte des Haushalts (alle Wörter, ohne Netz), dann Open Food Facts mit Länderfilter Schweiz. Die Antwort sagt, ob die offene Datenbank gefragt wurde, nicht erreichbar war oder fehlt.
- **«Bereits verwendet» live beim Tippen:** Die eigenen Produkte (`scope: household`) erscheinen schon ab zwei Buchstaben. Das geschieht nur auf dem Gerät, ohne Netz.
- **Open Food Facts erst auf Tipp** («… suchen»), nie während des Tippens. So bleibt die App unter der Grenze und schickt nichts Halbfertiges weg.
- **Neuer Datenfluss, von Alban gewünscht:** Nur die getippten Wörter gehen an Open Food Facts, ohne Cookies und Referrer, wie beim Barcode. Die Datenschutzerklärung nennt das.
- **Auswahl = Barcode:** Ein Treffer bringt seinen Barcode mit. Danach läuft derselbe Weg wie beim Scan (`products.lookup`, 30-Tage-Cache, Packungsbild, ODbL-Hinweis). Der nächste Scan desselben Produkts kennt es dann.
- **Fällt die Suche aus** (offline, zu viele Suchen), bleiben die eigenen Produkte, und die App sagt, dass man es von Hand erfassen kann.

## Konsequenzen

- Für viele Schweizer Produkte reicht Tippen statt Scannen. Die Abdeckung hängt von Open Food Facts ab.
- Jede Handerfassung landet im eigenen Haushalt und wird beim nächsten Mal gefunden. Eine gemeinsame Produktdatenbank aus allen Haushalten kommt erst mit Konten und Einwilligung (Idee in `ideen/scan-und-produktdaten.md`).

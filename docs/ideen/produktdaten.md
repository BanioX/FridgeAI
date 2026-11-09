# Produktdaten: woher Name, Nährwerte und Bild kommen

Stand: 7.11.2026. Alban: «Gibt es eine bessere Datenquelle als Open Food Facts?», «mit der Website von Migros, Coop, Denner, Lidl, Aldi abgleichen», «wie bei MyFoodRepo: Produkt nicht gefunden, mach ein Foto».

**Harte Regeln (CLAUDE.md):**
- Keine echten Partner-Anbindungen an Migros, Coop und andere, nur Interfaces mit Mocks. Öffentliche Produktdaten nach ADR-0045 sind erlaubt.
- Was Daten neu vom Gerät schickt, entscheidet Alban.

## Quellen im Vergleich

| Quelle | Zugang | Schweiz | Einschätzung |
| --- | --- | --- | --- |
| **Open Food Facts** (heute) | offen, ohne Schlüssel. Suche etwa 10 Anfragen pro Minute | gut bei Markenartikeln, lückenhaft bei Eigenmarken. Namen teils nur französisch | bleibt die Basis |
| **Open Food Repo / MyFoodRepo** (EPFL, Digital Epidemiology Lab) | offene Daten (2018: über 21'000 Schweizer Produkte, später 38'000 bis 45'000 genannt), API mit Schlüssel ([Paper](https://arxiv.org/abs/1801.10195)) | stark bei Migros- und Coop-Eigenmarken | aktueller Stand und API von hier aus nicht erreichbar. Alban kann foodrepo.org prüfen. Ein Schlüssel gehört nicht in die App, dafür bräuchte es einen kleinen Proxy (Cloudflare Worker, gratis). Neuer Datenfluss: **Alban entscheidet** |
| **Migros, Coop, Denner, Lidl, Aldi** (Websites) | keine offene API. Laut Migipedia gibt Migros Dritten keinen Zugang ([Forum](https://migipedia.migros.ch/de/forum/migipedia/is-there-an-api-for-migros-product-data)) | vollständig für die eigenen Produkte | **Seit 8.11.2026 (Alban, [ADR-0045](../adr/0045-retailer-catalog.md)):** ein höflicher Crawler sammelt, was technisch offen ist (Aldi, Lidl, Denner). Migros und Coop sperren Bots und kommen über Open Food Facts. Abgleich auf dem Gerät |
| **GS1 Schweiz** (trustbox, «Verified by GS1») | kostenpflichtig, für Mitglieder | Stammdaten der Hersteller | kostet Geld: Alban entscheidet, später mit Partnern |

## Was Rettich selbst besser machen kann (Reihenfolge)

1. **Quittung automatisch abgleichen, Ja/Nein pro Treffer** (umgesetzt 7.11.2026, ADR-0036).
2. **Barcode pro Quittungszeile scannen**, wenn nichts gefunden wurde (umgesetzt 7.11.2026). Der Barcode ist eindeutig und funktioniert auch für Eigenmarken, sobald sie in einer offenen Datenbank stehen. Rettich merkt sich die Zuordnung für die nächste Quittung.
3. **Foto der Nährwerttabelle** (umgesetzt 7.11.2026: Foto oder Screenshot, z. B. von Migipedia oder coop.ch, wird auf dem Gerät gelesen und nie gespeichert oder gesendet) wie bei MyFoodRepo, wenn auch der Barcode unbekannt ist. Die Schrift liest tesseract auf dem Gerät, ein Parser in `packages/core` macht daraus Energie, Fett, Zucker, Eiweiss und Salz. Nichts verlässt das Gerät. Aufwand M.
4. **Beitragen an Open Food Facts** (optional, mit Konto der Person): Fotos und Werte hochladen, damit der nächste Haushalt das Produkt kennt. Neuer Datenfluss, **Alban entscheidet**.
5. **Gemeinsames Gedächtnis über Haushalte** (mit Konten, Schritt 7): Wenn eine Quittungszeile bei einem Haushalt bestätigt ist, kennen sie alle. Das wäre der eigentliche Vorsprung gegenüber allen anderen Apps. Datenschutz: nur die Zuordnung Quittungs-Text → Barcode, nie wer was gekauft hat. **Alban entscheidet.**

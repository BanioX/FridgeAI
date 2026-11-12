# Rettich – Produkt- und Lebensmitteldaten: Quellen

> Stand: 12. November 2026.
> Grundsatz: Nur offizielle, lizenzierte Zugänge. Keine nachgebauten (reverse-engineerten) Schnittstellen.

## Übersicht

| Quelle | Was | Zugang und Lizenz | Status | Nutzen für Rettich |
| --- | --- | --- | --- | --- |
| **Open Food Facts** | Weltweite Produktdatenbank per Barcode (Name, Marke, Kategorie, Nährwerte, Bilder), viele CH-Produkte | Offene API, Daten unter ODbL (Quellenangabe, Share-alike für die Datenbank) | Aktiv | **Umgesetzt:** Barcode → Produkt vorausfüllen |
| **Open Food Repo** (EPFL, Digital Epidemiology Lab) | Barcode-Produkte mit Fokus Schweiz (Name, Zutaten, Nährwerte, Bilder) | Öffentliche, kostenlose API laut Projekt | **Unklar:** Showcase-Seite nennt den Support-Status «Inactive» | **Optional:** zweite Quelle für Schweizer Eigenmarken, nur wenn API und Bedingungen vor dem Einbau bestätigt sind |
| **Schweizer Nährwertdatenbank** (BLV) | Offizielle Nährwerte für generische Lebensmittel in der Schweiz | Kostenlos; opendata.swiss: kommerzielle Nutzung erlaubt, Quellenangabe nötig (Wortlaut vor Nutzung auf naehrwertdaten.ch prüfen); XLSX-Download und API | Aktiv (V 7.1, 01.07.2026); Lizenz am 12.11.2026 bestätigt, Quellenvermerk «Schweizer Nährwertdatenbank V 7.1, BLV» | **Umgesetzt (ADR-0064):** geschätzte Nährwerte für unverarbeitete Frischware, **lokal mitgeliefert** (keine Daten verlassen das Gerät) |

## Architektur

- Produktquellen laufen über den Port `ProductCatalog`. Mehrere Adapter lassen sich verketten: zuerst lokaler Cache, dann Open Food Facts, optional Open Food Repo.
- Nährwerte kommen vom Produkt (Open Food Facts) oder, für Frisches ohne Etikett, geschätzt aus der Schweizer Nährwertdatenbank (ADR-0064).
- Jede Abfrage bei einem externen Dienst schickt mindestens die Barcode-Nummer und die IP-Adresse dorthin. Deshalb nennt die Datenschutzerklärung jede Online-Quelle ([`privacy.md`](./privacy.md)).

## Quellen der Recherche

- FoodRepo-Paper (EPFL): https://infoscience.epfl.ch/record/258954
- Open Food Repo, Projekt-Showcase: https://showcase.c4dt.org/projects/openfoodrepo
- BLV, Schweizer Nährwertdatenbank: https://www.blv.admin.ch/de/schweizer-naehrwertdatenbank
- opendata.swiss, Nährwerte: https://opendata.swiss/en/dataset/naehrwerte

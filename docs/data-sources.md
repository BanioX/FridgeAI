# Rettich – Produkt- und Lebensmitteldaten: Quellen

> Stand: 6. November 2026. Recherche auf Albans Frage nach YAZIO und MyFoodRepo.
> Grundsatz: Nur offizielle, lizenzierte Zugänge. Keine nachgebauten (reverse-engineerten) Schnittstellen.

## Übersicht

| Quelle | Was | Zugang und Lizenz | Status | Nutzen für Rettich |
| --- | --- | --- | --- | --- |
| **Open Food Facts** | Weltweite Produktdatenbank per Barcode (Name, Marke, Kategorie, Nährwerte, Bilder), viele CH-Produkte | Offene API, Daten unter ODbL (Quellenangabe, Share-alike für die Datenbank) | Aktiv | **MVP, Schritt 10:** Barcode → Produkt vorausfüllen |
| **Open Food Repo** (EPFL, Digital Epidemiology Lab; Datenbasis von MyFoodRepo) | Barcode-Produkte mit Fokus Schweiz (Name, Zutaten, Nährwerte, Bilder) | Öffentliche, kostenlose API laut Projekt | **Unklar:** Showcase-Seite nennt den Support-Status «Inactive» | **Optional, Schritt 10:** zweite Quelle für Schweizer Eigenmarken, nur wenn API und Bedingungen vor dem Einbau bestätigt sind |
| **MyFoodRepo** (EPFL) | Ernährungs-Tracking-Plattform für Forschung und Fachleute | Keine Datenbank zum Einbinden; öffentlicher Start mit Warteliste angekündigt | Im Aufbau | Kein direkter Einbau; möglicher Forschungspartner (Vision) |
| **Schweizer Nährwertdatenbank** (BLV) | Offizielle Nährwerte für generische Lebensmittel in der Schweiz | Kostenlos; opendata.swiss: kommerzielle Nutzung erlaubt, Quellenangabe nötig (Wortlaut vor Nutzung auf naehrwertdaten.ch prüfen); XLSX-Download und API | Aktiv (Revision Juli 2023) | **v1/Vision:** Nährwerte pro Kategorie, **lokal mitgeliefert** (keine Daten verlassen das Gerät) |
| **YAZIO** | Kalorienzähler mit eigener, proprietärer Lebensmitteldatenbank | **Keine offizielle öffentliche API** (offener Wunsch im YAZIO-Feedbackboard). Inoffizielle, nachgebaute Zugänge brauchen YAZIO-Benutzername und Passwort | – | **Nur über eine Partnerschaft** (Vision, `NutritionProvider`-Port). Inoffizielle Zugänge kommen nicht in Frage: verletzen Nutzungsbedingungen, gefährden Zugangsdaten, brechen jederzeit |

## Architektur

- Produktquellen laufen über den Port `ProductCatalog` (Schritt 2d). Mehrere Adapter lassen sich verketten: zuerst lokaler Cache, dann Open Food Facts, optional Open Food Repo.
- Nährwerte sind im MVP bewusst ausgeschlossen (ERRC-Raster: «Eliminieren»). Später ergänzt ein Port `NutritionProvider` sie, z. B. aus der BLV-Datenbank pro Kategorie oder von einem Partner wie YAZIO.
- Jede Abfrage bei einem externen Dienst schickt mindestens die Barcode-Nummer und die IP-Adresse dorthin. Deshalb gilt Frage 3a im Plan (Hinweis und Schalter) für jede Online-Quelle.

## Quellen der Recherche

- YAZIO-Feedbackboard, Wunsch nach öffentlicher API: https://feedback-en.yazio.com/suggestions/713173/a-public-api-andor-mcp-server-integration
- Inoffizielle YAZIO-API-Doku (nicht verwenden): https://github.com/saganos/yazio_public_api
- FoodRepo-Paper (EPFL): https://infoscience.epfl.ch/record/258954
- Open Food Repo, Projekt-Showcase: https://showcase.c4dt.org/projects/openfoodrepo
- BLV, Schweizer Nährwertdatenbank: https://www.blv.admin.ch/de/schweizer-naehrwertdatenbank
- opendata.swiss, Nährwerte: https://opendata.swiss/en/dataset/naehrwerte

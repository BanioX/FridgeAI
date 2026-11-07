# Parkplatz: grosse Hebel mit Abklärungsbedarf

Hier parkt alles, was nachweislich einen USP hätte, aber vor dem Bau eine Abklärung braucht: einen Partner, einen Vertrag, Geld, eine Rechtsfrage oder einen neuen Datenfluss. Alban wollte am 7.11.2026 einen festen Ort dafür.

**Regeln**

- Claude führt die Datei bei jedem Gespräch nach, in dem ein solcher Hebel auftaucht (CLAUDE.md, Arbeitsweise Punkt 6).
- **Entscheiden tut Alban.** Ein Eintrag wandert erst in den [Plan](../plan.md), wenn er entschieden ist.
- **Status:** `geparkt` · `in Abklärung` · `entschieden → Plan` · `verworfen` (mit Grund).
- Kleinere Ideen ohne Abklärungsbedarf stehen in den anderen Dateien dieses Ordners ([Übersicht](./README.md)).
- Pitch und Businessplan liegen als Artifacts vor: [rettich Pitch](https://claude.ai/artifact/GCdjDPAGbtJLmXAoguBBLS), [rettich Businessplan](https://claude.ai/artifact/LUoSvobGNDrPYsc2453SNd).

## Übersicht

| # | Hebel | USP: warum gross | Was abzuklären ist | Status |
| --- | --- | --- | --- | --- |
| P1 | **Partnerschaft mit Migros und Coop** (auch Denner, Lidl, Aldi): Produktdaten, Nachkauf mit Provision, digitale Kassenzettel | Kein Abfotografieren mehr, vollständige Produktdaten, Nachkauf in einem Tipp. Daraus entsteht ein Geschäftsmodell (siehe unten) | Pitch, Vertrag, Einwilligung pro Haushalt, Provisionshöhe | geparkt |
| P2 | **Gemeinsames Gedächtnis über alle Haushalte**: Bon-Text → Barcode | Netzwerkeffekt: Ein bestätigter Bon hilft allen. Mit jeder Person wird rettich besser, das kann niemand kopieren | Konten und Server (P6), Datenschutz: nur die Zuordnung, nie wer was kauft | geparkt |
| P3 | **WG-Funktionen**: wem gehört's, wer schuldet was | Kern der Vision («Scan deinen Bon – rettich weiss, … wem es gehört, wer was schuldet»). Kein Konkurrent kann das | Konten, Sync, Einladungen, Abrechnung (P6). «Wer hat's gegessen» (wer im Haushalt wischt) gehört zu den WG-Funktionen. | geparkt |
| P4 | **Open Food Repo der EPFL** als zweite Produktquelle | Stark bei Schweizer Eigenmarken, also genau der Lücke von Open Food Facts | Lebt die API noch? Lizenz, Schlüssel über einen Gratis-Proxy, neuer Datenfluss | geparkt |
| P5 | **Beitragen an Open Food Facts** (Fotos, Nährwerte) | Unbekannte Produkte werden für alle bekannt; rettich als guter Bürger der offenen Daten | Konto der Person bei Open Food Facts, neuer Datenfluss | geparkt |
| P6 | **Backend und Konten** (Hono, PostgreSQL) | Voraussetzung für P2, P3, Sync zwischen Handys, echte Push-Mitteilungen | Hosting-Kosten, Datenschutz (ADR-0020), Betrieb. Die drei Schichten sind vorbereitet (ADR-0034) | geparkt |
| P7 | **App Store über Capacitor** | Echte App-Symbole, Push, Taschenlampe auch auf dem iPhone, Hintergrund-Erinnerungen, Vertrauen | Kosten: Apple USD 99 pro Jahr, Google USD 25 einmal; Review-Prozess ([`app-stores.md`](./app-stores.md)) | geparkt |
| P8 | **Marke und Domain**: rettich.app, Marke Schweiz und EU | Schutz vor Kopien, bevor das Marketing startet | CHF 350 (Schweiz), EUR 900–1050 (EU). «Rettermarkt Rettich» in Saarbrücken prüfen ([`schutz.md`](./schutz.md)) | geparkt (Alban) |
| P9 | **Start in Deutschland und Österreich** | Zehnfacher Markt. Die Währungs-Grundlage ist gebaut (ADR-0019) | Bon-Parser für Rewe, Edeka, Spar, Billa usw., Schätzpreise pro Land, Befehl zum Umstellen der Währung | geparkt |
| P10 | **GS1-2D-Codes** («Sunrise 2027») mit GS1 Schweiz | Ablaufdatum direkt aus dem Code, ohne Tippen. rettich liest sie schon heute | Pilotpartner, Zeitplan der Händler ([`integrationen.md`](./integrationen.md)) | geparkt |
| P11 | **Thermomix/Cookidoo, Samsung Food** und eine **offene rettich-Schnittstelle** (OpenAPI, MCP) | rettich als Schicht zwischen Einkauf und Küche | Ob die Importe funktionieren, Partnergespräche, Einwilligung ([`integrationen.md`](./integrationen.md)) | geparkt |
| P12 | **Kühlschrank-Hersteller** (LG, Samsung) und EU Data Act | Langfristig Daten direkt vom Gerät | Kein Hersteller öffnet heute sein Inventar ([`integrationen.md`](./integrationen.md)) | geparkt |
| P13 | **Preisvergleich zwischen Läden** («bei Coop 30 Rappen günstiger») | Spart Geld, nicht nur Lebensmittel | Preisdaten der Händler (P1) oder Preise aus vielen Haushalten (P2), Datenschutz | geparkt |
| P14 | **Gamification**: Fortschritt, Serien, «Bon komplett», Reineclaude-Erfolg | Macht das Erfassen zur Routine | Nach dem Pilot mit echten Zahlen. Gestaltung mit Alban ([`designsprache-garten.md`](./designsprache-garten.md)) | geparkt |
| P15 | **Aggregierte Food-Waste-Kennzahlen** für Handel, Forschung, Gemeinden | Einnahmen ohne Werbung. Messbarer Beitrag zum Ziel 2030 | Genug Haushalte, Anonymisierung (k-Anonymität), Einwilligung. Nie Einzeldaten verkaufen | geparkt |
| P16 | **Förderung** (z. B. Innosuisse, Aktionsplan des Bundes gegen Lebensmittelverschwendung, Stiftungen) | Geld ohne Anteile abzugeben, dazu Glaubwürdigkeit | Passende Programme, Firmenform, Gesuch | geparkt |
| P17 | **Büro-Kühlschrank für Teams** | B2B-Einnahmen pro Team | Eigener Vertrieb, Konten (P6) ([`monetarisierung.md`](./monetarisierung.md)) | geparkt |

## P1 im Detail: Migros und Coop als Partner

**Alban, 7.11.2026:** «Ich könnte mir vorstellen, Migros oder Coop meine App zu pitchen, damit sie Partner werden und die Nutzer über meine App Produkte nachkaufen können, als Provisionsmodell.»

**Technisch ist das einfach, sobald ein Händler öffnet.** rettich hat die Anschlüsse schon, heute mit Mocks:

| Port in `packages/core/src/ports` | Was ein Partner liefert | Was es für die Person heisst |
| --- | --- | --- |
| `ProductCatalog` | Produktdaten per Barcode (Name, Grösse, Nährwerte, Bild) | Jeder Artikel ist vollständig, auch Eigenmarken |
| `RetailerReceiptSource` | Digitale Kassenzettel (Cumulus, Supercard) mit Einwilligung | Der Bon kommt von selbst, ohne Foto und ohne Lesefehler |
| `RebuyProvider` | Angebote zum Nachkaufen | «Milch ist leer – bei Migros nachkaufen?» |
| `DeliveryProvider` | Warenkorb beim Händler, Link zur Kasse | Ein Tipp füllt den Warenkorb, die Provision läuft über den Link |

Ein Partner-Adapter ist Arbeit von Tagen, nicht Monaten. Der Aufwand liegt beim Vertrag, bei der Einwilligung pro Haushalt (CLAUDE.md: widerrufbar, kein Verkauf von Einzeldaten) und bei einem Server für die Schlüssel des Partners (P6).

**Was die Händler davon haben (für den Pitch):**

- **Kundenbindung:** Die App nutzt man jeden Tag, nicht nur beim Einkaufen.
- **Nachkauf-Umsatz** im eigenen Online-Shop.
- **Nachhaltigkeitsziele:** Food Waste im Haushalt halbieren bis 2030 ([`markt-und-timing.md`](./markt-und-timing.md)).
- **Anonyme Erkenntnisse** dazu, was im Haushalt verdirbt, was zu gross verpackt ist und wo die Haltbarkeit zu knapp ist (P15).
- **Ein Abnehmer** für ihre digitalen Kassenzettel.

**Erste Schritte:**

1. Pilot mit echten Zahlen: gerettete CHF, aktive Haushalte, Bons pro Woche.
2. Pitch-Artifact um die Händler-Seite ergänzen.
3. Kontakt über Innovations- und Nachhaltigkeitsteams (Migros: z. B. Generation M; Coop: Nachhaltigkeit) statt über den Kundendienst.

## Geschäftsmodell-Entwurf (zu prüfen)

Stand: 7.11.2026, aufbauend auf [`monetarisierung.md`](./monetarisierung.md) und dem Businessplan. **Nichts davon ist entschieden.**

| Säule | Wer zahlt | Wofür | Voraussetzung | Wann |
| --- | --- | --- | --- | --- |
| 1. **Haushalts-Abo «Pro»** | Haushalte, WGs | ohne Werbung, mehrere Personen, Berichte, Sync | Konten (P6). Preisgrenze um CHF 3–5 pro Monat (Konkurrenz, siehe `monetarisierung.md`) | nach dem Pilot |
| 2. **Provision auf Nachkauf** | Händler, Lieferdienste | Nachkauf und Warenkorb aus rettich | Vertrag (P1) | mit dem ersten Partner |
| 3. **Partner-Daten statt Werbung** | Händler, Marken | anonyme, aggregierte Kennzahlen (P15) | Grösse, Einwilligung, Anonymisierung | spät |
| 4. **Förderung und Impact** | öffentliche Hand, Stiftungen | messbar weniger Food Waste | Kennzahlen aus dem Pilot (P16) | parallel |
| 5. **Team-Lizenz** | Firmen | Büro-Kühlschrank (P17) | Konten, Vertrieb | später |

**Kennzahlen, die das Modell prüfen:**

- Aktivierung: erster Bon in den ersten 24 Stunden.
- Wöchentlich aktive Haushalte.
- Gerettete CHF pro Haushalt und Monat.
- Wochen-4-Retention.
- Umwandlung zu Pro.
- Klickrate auf «Nachkaufen».

**Reihenfolge:** Pilot ohne Geld → Pro-Test → Pitch mit Pilotzahlen bei einem Händler → Provision → Daten und B2B.

## Verlauf

| Datum | Änderung |
| --- | --- |
| 7.11.2026 | Parkplatz angelegt (Alban). Aus dem bisherigen Verlauf gesammelt: P1–P17, Geschäftsmodell-Entwurf. Quellen: Albans Wünsche vom 6. und 7.11.2026, `integrationen.md`, `produktdaten.md`, `schutz.md`, `monetarisierung.md`, `app-stores.md`, `designsprache-garten.md`, ADR-0019, ADR-0034 |

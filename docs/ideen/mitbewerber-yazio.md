# Mitbewerber YAZIO: was Rettich daraus lernt

Alban hat am 7.11.2026 eine Analyse der YAZIO GmbH (Erfurt) geteilt: Kennzahlen, Datenbeschaffung, Technik. Claude hat sie geprüft und eingeordnet. Hier steht nur, was für Rettich zählt. Ältere YAZIO-Notizen: [`scan-und-produktdaten.md`](./scan-und-produktdaten.md), [`../data-sources.md`](../data-sources.md), Abo-Kennzahlen in [`markt-und-timing.md`](./markt-und-timing.md).

## Einordnung

YAZIO ist ein Kalorienzähler, kein Vorrats-Planer. Es ist also **kein direkter Konkurrent, aber ein Nachbar**:

- Es hat dieselben Produktdaten (Barcodes, Schweizer Eigenmarken) und dieselben Nutzer:innen im DACH-Raum.
- **Risiko:** YAZIO könnte einen Vorrats-Modus nachrüsten.
- **Gegenmittel:** Was YAZIO nicht hat und als Kalorienzähler schwer bauen kann: die Quittung als Eingang, der Wert in Franken, «Rette heute» und der geteilte Haushalt.

## Prüfung der Zahlen

| Aussage | Status | Bemerkung |
| --- | --- | --- |
| Rohergebnis 48.0 Mio. €, Marketing und Gebühren 37.3, Personal 7.0, Steuern 1.44, Gewinn 2.3 | **in sich stimmig** | 48.0 − 37.3 − 7.0 − 1.44 ≈ 2.3. Den Jahresabschluss selbst konnte Claude online nicht abrufen (Bundesanzeiger, HRB 507453 Jena). |
| 8.5 Mio. aktive Nutzer:innen pro Monat, 5–7 % zahlen | **geschätzt** (App-Store-Tracker) | Ergibt 0.4–0.6 Mio. Zahlende. |
| 1.5–1.9 Mio. Zahlende | **abgeleitet** (Umsatz ÷ 25–30 € pro Abo) | **Widerspricht der Zeile davor um Faktor 3.** Entweder sind die aktiven Nutzer:innen zu tief geschätzt, oder viele Jahresabos werden kaum genutzt. |
| Umwandlung 5–7 % | **zu optimistisch für unseren Plan** | Rettich rechnet weiter mit 2–5 % (Median Freemium 2.18 %, [`markt-und-timing.md`](./markt-und-timing.md)). |
| Technik (Kotlin, Elasticsearch, Dagster, Snowflake), private API `/v22` | **nicht prüfbar** | Teils aus Stellenanzeigen, teils aus dem Auslesen der App. Rettich nutzt YAZIOs private API nie ([`../data-sources.md`](../data-sources.md)). |

## Was Rettich übernimmt

| # | Was YAZIO macht | Was Rettich daraus macht | Wann | Aufwand |
| --- | --- | --- | --- | --- |
| Y1 | Unverpackte Lebensmittel aus amtlichen Datenbanken, in der Schweiz aus der **Schweizer Nährwertdatenbank des BLV** | Dieselbe Datenbank selbst gehostet für Rüebli, Äpfel, Poulet und Brot vom Bäcker. Laut [opendata.swiss](https://ckan.opendata.swiss/de/dataset/naehrwerte_lebensmittel/resource/b6304b89-e1f6-444b-8c79-cafdbae8af52) ist kommerzielle Nutzung mit Quellenangabe erlaubt; vor dem Einbau auf [naehrwertdaten.ch](https://naehrwertdaten.ch/de/downloads/) bestätigen. Kein neuer Datenfluss, kein Konto, gratis | nach dem Pilot | M |
| Y2 | Suche in Stufen: eigene Produkte, dann das Land, dann der Sprachraum, dann weltweit | Rettich sucht heute eigene Produkte, dann nur Schweizer Produkte. Neu: findet die Schweiz nichts, ein zweiter Versuch im deutschen Sprachraum. Kostet eine Suche mehr (Grenze 8 pro Minute, L-06) | wenn Pilot-Tests leere Treffer zeigen | S |
| Y3 | Neue Barcodes darf jede Person anlegen. Bestehende ändern nur Vertrauenswürdige, und Namensänderungen gehen in eine Prüfung | Vorlage für das gemeinsame Gedächtnis über alle Haushalte (P2): Schutz vor Unsinn ohne viel Moderation | mit P2 | – |
| Y4 | Dubletten pro Barcode zusammenführen, Ausreisser über den Median aussortieren (1200 statt 120 kcal) | Für P2 dieselbe Regel. Das Preis-Gedächtnis nutzt den Median schon (ADR-0029) | mit P2 | – |
| Y5 | Statische Nährwert-Seiten bringen Besucher:innen gratis über Google | Statische Seiten «Wie lange hält offener Rahm?» aus dem eigenen Haltbarkeits-Katalog. Gratis auf Cloudflare, ohne Nutzerdaten, jede Seite führt zu Rettich | nach dem Pilot | M |
| Y6 | Jahresabos bringen Geld im Voraus (23.6 Mio. € abgegrenzt) | Bestätigt «Jahresabo zuerst» ([`markt-und-timing.md`](./markt-und-timing.md)) | mit Pro | – |
| Y7 | Werbung und App-Store-Gebühren fressen rund 78 % des Rohergebnisses, Gewinn rund 5 % | **Bezahltes Wachstum frisst die Marge.** Rettich wächst zuerst ohne Werbebudget: Einladungen in der WG, Seiten aus Y5, Presse zum Thema Food Waste, Händler-Partner (P1) | Pilot bis Pro | – |

## Bewusst nicht übernehmen

- **Nährwerte pro 1 g als Kommazahl speichern.** Rettich speichert wie die Packung pro 100 g (ADR-0006). Umrechnen kostet nichts, und Nährwerte sind bei Rettich Nebensache.
- **Microservices, Elasticsearch, Snowflake, Dagster.** Das passt zu 100 Mitarbeitenden und 100 Millionen Konten. Rettich bleibt bei drei Schichten in einem Paket (ADR-0034), bis Zahlen etwas anderes verlangen. Das ist bewusst keine Schuld.
- **Eigene native Apps in Swift und Kotlin.** Rettich bleibt eine Web-App; nativ wird es über Capacitor (P7), wenn nötig.
- **Datenbank als Burggraben.** YAZIOs Schutz ist die kuratierte Datenbank. Rettich setzt auf offene Daten und baut seinen Vorsprung im Haushalt auf: Retten, WG, Franken, Quittung. Daten dazu sind die Zuordnungen Quittung → Barcode (P2).

## Für den Parkplatz

- **P23 Stammdaten-Pools** (GDSN, GS1 Schweiz trustbox): verifizierte Herstellerdaten mit Bild und Nährwerten, auch für Eigenmarken. Braucht Mitgliedschaft und Vertrag, siehe [`parkplatz.md`](./parkplatz.md).

## Quellen

- Albans Analyse «Mitbewerber-Analyse: YAZIO GmbH» vom 7.11.2026 (nicht im Repo).
- Schweizer Nährwertdatenbank: [opendata.swiss](https://ckan.opendata.swiss/de/dataset/naehrwerte_lebensmittel/resource/b6304b89-e1f6-444b-8c79-cafdbae8af52), [BLV](https://www.blv.admin.ch/de/schweizer-naehrwertdatenbank), [Downloads](https://naehrwertdaten.ch/de/downloads/).
- Firmendaten YAZIO GmbH: [North Data](https://www.northdata.de/YAZIO+GmbH,Erfurt).

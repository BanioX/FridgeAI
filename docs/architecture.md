# FridgeAI – Architektur: heute bauen, morgen skalieren

> Stand: 6. November 2026. Auftrag von Alban: «Denke gross, erweiterbar, wartbar, state of the art, skalierbar bis Unicorn.»
> Entscheide im Detail: [`adr/`](./adr/). Plan: [`plan.md`](./plan.md). Use Cases: [`use-cases.md`](./use-cases.md).

## 1. Leitprinzipien

1. **Modularer Monolith statt Microservices.** Ein Repo, klare Module (`core`, `web`, später `api`, `mobile`), harte Grenzen über Ports und den Vertrag. Microservices erst, wenn ein Teil wirklich unabhängig skalieren muss (Erfahrungswert: Millionen aktive Haushalte, nicht vorher).
2. **Contract-first** (ADR-0005): Jede Aktion ist ein Command oder eine Query mit Zod-Schema. Daraus entstehen REST-API, MCP-Tools, später Widgets und Kurzbefehle. Ein Vertrag, viele Oberflächen.
3. **Local-first** (ADR-0003): Die App funktioniert offline und ohne Konto. Das entlastet Server (die meisten Lesezugriffe passieren auf dem Gerät) und ist ein Datenschutz-Vorteil.
4. **Event-getrieben:** Jede Änderung erzeugt ein Domain Event. Push, Dashboards, Wirkungsberichte und Partner-Webhooks hängen sich an Events, nicht an die Datenbank.
5. **Datenschutz als Produktmerkmal:** Bilder bleiben auf dem Gerät, ausser die Person willigt ausdrücklich ein. Kein Verkauf von Einzeldaten.
6. **Mehrsprachig von Anfang an** (ADR-0008): Deutsch zuerst, Französisch, Italienisch und Englisch sind im Code vorgesehen.

## 2. Frontend

| Thema | Entscheid | Warum |
| --- | --- | --- |
| Framework | **React 19 + TypeScript + Vite** (bleibt) | Grösstes Ökosystem, beste Talentbasis, gleiche Sprache wie Backend und Kern. Angular wäre ebenfalls robust, bringt hier aber keinen Vorteil und würde den bestehenden Stand verwerfen. |
| App-Form | **PWA** jetzt, **native Hülle mit Capacitor** in v1 | Eine Codebasis für Web, iOS und Android; native Teile dort, wo nötig (Widgets, Kurzbefehle, Haptik). |
| Daten im Gerät | IndexedDB (Dexie) | Offline, schnell, gross genug für jahrelange Vorräte. |
| Design | Eigenes Design-System (Tokens, Bausteine, Styleguide) | Einheitlich, zugänglich, schnell erweiterbar. |

### iOS und Android (v1/v2)

- **Widgets (WidgetKit / Android Glance):** zeigen «Heute retten» und den CHF-Wert. Die App schreibt nach jeder Änderung eine kleine Zusammenfassung in einen gemeinsamen Speicher (iOS App Group), das Widget liest nur diese.
- **Kurzbefehle, Siri, Action-Button (App Intents):** «Was läuft bald ab?», «Bon scannen», «Milch auf die Liste». Jede Intent ruft eine Operation aus dem Vertrag auf (offline über den Gerätespeicher oder online über die API).
- **Taptic Engine:** Haptik bei Scan-Treffern, Speichern und Warnungen (Capacitor Haptics).

## 3. Backend (ab Schritt 7)

Orientiert an HUB-042 (Albans bewährtem Betrieb), aber auf Wachstum ausgelegt:

| Baustein | Vorschlag | Warum |
| --- | --- | --- |
| API-Server | **Node.js 24 + Hono** (TypeScript) | Klein, schnell, typisiert; derselbe Code läuft auf Node (Docker) und später auf Edge-Plattformen wie Cloudflare Workers. OpenAPI direkt aus unseren Zod-Schemas. |
| Datenbank | **PostgreSQL** (Docker lokal und im Betrieb) | Bewährt bis zu sehr grossen Datenmengen; Row-Level-Security pro Haushalt; `householdId` ist ein natürlicher Schlüssel zum späteren Aufteilen (Sharding). |
| Zugriff auf die DB | Drizzle ORM (typisierte SQL-Abfragen, Migrationen im Repo) | Typsicherheit vom Schema bis zur UI. |
| Login | Magic Link per E-Mail, später Passkeys; OAuth für Partner und MCP | Ohne Passwörter; Standard-OAuth für externe Clients. |
| Hintergrundjobs | Queue in Postgres (z. B. pg-boss) für Digest, Push, Wirkungsberichte | Kein zusätzlicher Dienst nötig; später austauschbar. |
| Betrieb | **Docker Compose**, Image auf GHCR, automatische Updates, öffentlich über Cloudflare Tunnel | Wie HUB-042: gratis, ohne offene Ports, ein Merge geht live. |
| Hosting Pilot | Oracle Cloud Always Free, Region Zürich (wie HUB-042) oder Albans eigener Server | 0 CHF, Daten in der Schweiz. |
| Testnutzer | `docker compose up` startet DB und API lokal; Seed-Skript legt Test-Haushalte an | Gleiche Umgebung auf Laptop, CI und Server. |

## 4. Skalierungspfad

| Phase | Nutzer | Architektur |
| --- | --- | --- |
| Pilot | 10–100 Haushalte | 1 Server, Docker Compose, 1 Postgres |
| Wachstum | bis ~100'000 | Mehrere API-Container hinter Load-Balancer (die API ist zustandslos), verwaltetes Postgres mit Replikaten, CDN für die PWA, Queue für Jobs, Monitoring (OpenTelemetry) |
| Skala | Millionen | Datenbank nach `householdId` aufteilen, Regionen (CH/EU, später weitere), Event-Stream für Partner und Analytik, eigene Dienste nur für die heissesten Teile (z. B. Bild-Erkennung, Benachrichtigungen) |

Das Datenmodell ist dafür vorbereitet: global eindeutige IDs (UUIDv7) ohne zentrale Vergabe, `householdId` auf jeder Zeile, Soft-Delete, versionierter Vertrag und Events.

## 5. Erfassen: vom Tippen zur Automatik

| Weg | Stand |
| --- | --- |
| Bon-Foto, Migros-CSV, Coop-PDF | MVP (Schritte 4, 5, 10) |
| Barcode (EAN) + Produktdatenbank (Nährwerte, Kalorien, Allergene) | MVP (Schritt 10) |
| **2D-Codes (GS1 DataMatrix/QR) mit Ablaufdatum** | Logik fertig (ADR-0006), Scanner in Schritt 10 |
| **Scan-Modi «Schnell» und «Gründlich»** (Rundum-Scan) | Logik: neuer Schritt 2i; Kamera: Schritt 10 |
| Datum vom Etikett fotografieren | Logik fertig (2g), Kamera: v1 |
| **Kühlschrank-Foto («wie Google Lens»)** | Port und Ablauf jetzt geplant, Umsetzung v1 (siehe 5.1) |

### 5.1 Kühlschrank-Foto: so würde es funktionieren

1. **Foto machen** (oder kurzes Video, langsam schwenken).
2. **Erkennen:** Ein Bild-Erkennungsmodell findet Lebensmittel und gibt pro Fund Name, Kategorie, Menge (geschätzt) und Sicherheit zurück. Varianten:
   - *Auf dem Gerät:* schnell, privat, aber nur grobe Klassen (Banane, Apfel, Flasche).
   - *Server-KI mit Bildverständnis (Opt-in):* erkennt auch «Grana Padano 100 g, angebrochen». Kostet pro Foto ein paar Rappen, und das Bild verlässt das Gerät, deshalb nur mit ausdrücklicher Einwilligung; Bild wird nach der Auswertung gelöscht.
3. **Bestätigen:** Eine Review-Liste wie beim Bon: Funde als Karten, sichere vorausgewählt, unsichere markiert. Antippen ändert, Wischen entfernt.
4. **Abgleich mit dem Vorrat:** Was im Vorrat steht, aber auf dem Foto fehlt, schlägt die App als «aufgebraucht?» vor; Neues als «hinzufügen?». So wird das Foto zum automatischen Kühlschrank-Check (UC-04).

Technisch: Port `FridgePhotoRecognizer` (gleiches Muster wie `ReceiptOcrEngine`), Ergebnis als Liste von Funden mit Sicherheit; dieselbe Review-Komponente wie für Bons.

## 6. Gemeinschaft: vom Haushalt zum Kollektiv

| Stufe | Wer | Stand |
| --- | --- | --- |
| Haushalt | Familie, Paar, WG; Einladung per Link/Code | MVP (Schritt 7) |
| Rette-Kreis im Haushalt | Mitbewohner:innen übernehmen, was bald abläuft | MVP (Schritt 9) |
| **Haus und Nachbarschaft** | Freiwillige Kreise (Haus, Strasse, Quartier); Angebote nur mit grobem Ort (z. B. Postleitzahl), Abholung privat vereinbart | Vision |
| **Kollektiv** | Frugalist:innen, Foodsharing-Gruppen, öffentliche Kühlschränke, Gemeinden | Vision |

Damit das später ohne Umbau geht, wird der Rette-Kreis auf «Kreise» verallgemeinert: Ein Kreis hat Mitglieder und eine Art (`household`, `building`, `neighborhood`, `community`); Angebote richten sich an einen Kreis. Regeln für Kreise ausserhalb des Haushalts: nie Lebensmittel nach dem Verbrauchsdatum, Hinweise zu Kühlkette und Allergenen, Melden und Sperren, kein genauer Wohnort.

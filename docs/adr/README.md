# Architektur-Entscheide (ADR)

Jeder Entscheid mit Folgen steht hier als eigene Datei `NNNN-titel.md` (ADR-0001). Kleine Entscheide trifft Claude selbst und hält sie fest, grosse mit Geld oder neuen Datenflüssen entscheidet Alban (CLAUDE.md, Arbeitsweise).

**Pflege:** Wer ein ADR anlegt oder dessen Status ändert, führt diese Tabelle im selben PR nach. Ein abgelöstes ADR bleibt als Verlauf stehen, seine Statuszeile nennt das ADR, das es ablöst.

**Stand:** 12.11.2026, 66 Entscheide.

| Nr. | Titel | Status | Datum |
| --- | --- | --- | --- |
| [0001](0001-record-architecture-decisions.md) | Architekturentscheide festhalten | angenommen | 2026-11-06 |
| [0002](0002-tech-stack-and-tooling.md) | Tech-Stack und Tooling | angenommen | 2026-11-06 |
| [0003](0003-local-first-and-ids.md) | Local-first, clientseitige IDs und Soft-Delete | angenommen | 2026-11-06 |
| [0004](0004-money-in-rappen.md) | Geld als Integer-Rappen | angenommen | 2026-11-06 |
| [0005](0005-contract-first-api-mcp.md) | Contract-first – eine Schnittstelle für App, API und MCP | angenommen; `recipes.*` seit ADR-0048 wieder da | 2026-11-06 |
| [0006](0006-expiry-sources-and-gs1.md) | Ablaufdatum – Quellen, Datumsart und GS1-2D-Codes | angenommen | 2026-11-06 |
| [0007](0007-notvorrat.md) | Notvorrat als vierter Lagerort | angenommen | 2026-11-06 |
| [0008](0008-i18n.md) | Mehrsprachigkeit (DE, FR, IT, EN) | angenommen | 2026-11-06 |
| [0009](0009-backend-stack.md) | Backend-Stack und Betrieb (nach dem Muster von HUB-042) | angenommen; noch nicht umgesetzt (Meilenstein C) | 2026-11-06 |
| [0010](0010-auth.md) | Registrierung und Login | angenommen; noch nicht umgesetzt (Meilenstein C) | 2026-11-06 |
| [0011](0011-quantities-opening-outcomes.md) | Mengen, Öffnungsregel und Abschliessen mit Grund | angenommen; Punkt 5 abgelöst durch ADR-0046 | 2026-11-06 |
| [0012](0012-bring-your-own-ai.md) | KI-Erkennung über die KI der Nutzer:innen («Bring your own AI») | teilweise abgelöst: Stufe 1 entfernt, Stufe 2 offen | 2026-11-06 |
| [0013](0013-preview-deployments-cloudflare.md) | Vorschau-Deployments auf Cloudflare Workers | angenommen | 2026-11-06 |
| [0014](0014-barcode-scanning.md) | Barcode- und QR-Scan im Browser (ZXing als WebAssembly, selbst gehostet) | angenommen | 2026-11-06 |
| [0015](0015-licensing.md) | Lizenz proprietär | angenommen | 2026-11-06 |
| [0016](0016-open-food-facts.md) | Produktdaten zum Barcode – zuerst lokal, dann Open Food Facts | angenommen | 2026-11-06 |
| [0017](0017-release-and-maintenance-rhythm.md) | Releases und Pflege-Rhythmus – automatisch, durch Claude | angenommen | 2026-11-06 |
| [0018](0018-number-format.md) | Zahlen mit Dezimalpunkt, wie bei Franken | angenommen | 2026-11-06 |
| [0019](0019-currencies.md) | Jede Währung möglich, Pilot in Franken | angenommen | 2026-11-06 |
| [0020](0020-accounts-export-retention.md) | Konto, Export, Löschen und Aufbewahrung | angenommen | 2026-11-06 |
| [0021](0021-apple-design-language.md) | Design nach Apples Human Interface Guidelines | angenommen | 2026-11-06 |
| [0022](0022-fridge-check.md) | Kühlschrank-Check mit vier Antworten | angenommen; Antworten heissen seit ADR-0046 «Verwertet» und «Entsorgt» | 2026-11-06 |
| [0023](0023-book-after-cooking.md) | Nach dem Kochen abbuchen | abgelöst durch ADR-0040 | 2026-11-06 |
| [0024](0024-product-name-search.md) | Produkte nach Namen suchen («Coop Gipfeli») | angenommen; Suche beim Tippen geändert durch ADR-0025 | 2026-11-06 |
| [0025](0025-search-while-typing.md) | Suche beim Tippen | angenommen; ändert ADR-0024 | 2026-11-06 |
| [0026](0026-category-in-background.md) | Kategorie nur im Hintergrund | angenommen | 2026-11-07 |
| [0027](0027-receipt-parser.md) | Bon lesen – Preise aus dem Kassenzettel | angenommen | 2026-11-07 |
| [0028](0028-receipt-import.md) | Bon importieren und speichern | angenommen | 2026-11-07 |
| [0029](0029-price-memory.md) | Preisgedächtnis aus den eigenen Bons | angenommen | 2026-11-07 |
| [0030](0030-pdf-reports.md) | Berichte als PDF, auf dem Gerät erzeugt | angenommen; Name «Auszüge» seit ADR-0047 | 2026-11-07 |
| [0031](0031-tab-navigation.md) | Tab-Leiste – Start, Vorrat, ＋ Erfassen, Kochen, Mehr | angenommen; «Kochen» abgelöst durch «Wissen» (ADR-0040, ADR-0041) | 2026-11-07 |
| [0032](0032-name-rettich.md) | Die App heisst «Rettich» | angenommen | 2026-11-07 |
| [0033](0033-rescued-means-at-risk.md) | «Gerettet» heisst kurz vor Ablauf gegessen | angenommen; Zählregel abgelöst durch ADR-0039 | 2026-11-07 |
| [0034](0034-three-layers.md) | Drei Schichten – Präsentation, Logik, Daten | angenommen | 2026-11-07 |
| [0035](0035-premium-palette.md) | Premium-Palette – Smaragd, Silber, Onyx | angenommen | 2026-11-07 |
| [0036](0036-receipt-open-food-facts.md) | Bon mit Open Food Facts abgleichen | angenommen; Reihenfolge ergänzt durch ADR-0045 (zuerst der mitgelieferte Katalog) | 2026-11-07 |
| [0037](0037-shop-names.md) | Namen der Läden in der App, und «Quittung» statt «Bon» | angenommen | 2026-11-07 |
| [0038](0038-perishability.md) | Haltbarkeits-Stufe pro Kategorie, und neue Kategorien für Saucen und Dips | angenommen | 2026-11-08 |
| [0039](0039-rescue-confirmed.md) | «Gerettet» nur, wenn du es bestätigst | angenommen; ersetzt die Zählregel von ADR-0033 | 2026-11-08 |
| [0040](0040-no-recipes.md) | Rezepte und der Tab «Kochen» fallen weg | angenommen; teilweise abgelöst durch ADR-0048 | 2026-11-08 |
| [0041](0041-knowledge-tab.md) | Tab «Wissen» statt «Kochen» | angenommen | 2026-11-08 |
| [0042](0042-rescue-reward.md) | Die Belohnung nach «Gerettet»: nüchtern, mit Betrag und Food Fact | angenommen | 2026-11-08 |
| [0043](0043-growing-rettich.md) | Der wachsende Rettich auf Start, mit «Vorbild» als Meilenstein | angenommen | 2026-11-08 |
| [0044](0044-swelper.md) | Rettich ist der erste Kontext des SWELPER | angenommen | 2026-11-08 |
| [0045](0045-retailer-catalog.md) | Produktdaten der Händler sammeln (höflicher Crawler) | angenommen; `retail-ch.json` noch ungenutzt (TD-16) | 2026-11-08 |
| [0046](0046-awareness-verwertet-entsorgt.md) | Rettich ist eine Awareness-App: «verwertet» und «entsorgt» | angenommen | 2026-11-08 |
| [0047](0047-names-like-a-private-bank.md) | Namen wie bei einer Schweizer Privatbank | angenommen | 2026-11-08 |
| [0048](0048-recipes-return-under-wissen.md) | Rezepte kehren zurück, als Abschnitt unter «Wissen» | angenommen | 2026-11-11 |
| [0049](0049-public-repo-noindex.md) | Öffentliches Repo, App nicht in Suchmaschinen | angenommen | 2026-11-11 |
| [0050](0050-impact-since-first-month.md) | Wirkung sichtbar: «Seit deinem ersten Monat» und Zahl am App-Symbol | angenommen | 2026-11-11 |
| [0051](0051-item-badges-and-freeze-hint.md) | Badges am Artikel, «Aufgetaut» und der Einfrier-Hinweis | angenommen | 2026-11-11 |
| [0052](0052-processing-value-moves-along.md) | Verarbeiten: der Wert wandert mit | angenommen | 2026-11-11 |
| [0053](0053-ingredient-or-ready-made.md) | Zutat oder Fertigprodukt: Rolle je Kategorie, Badge, Rezept-Regel | angenommen | 2026-11-11 |
| [0054](0054-achievements.md) | Abzeichen berechnen, nie speichern | angenommen | 2026-11-12 |
| [0055](0055-settle-pots.md) | Töpfe: Auswahl abschliessen | angenommen | 2026-11-12 |
| [0056](0056-storage-spots.md) | Plätze mit Foto: wo ist was? | angenommen | 2026-11-12 |
| [0057](0057-climate-balance.md) | Klimabilanz: CO₂e, Wasser, Fläche, Kehricht | angenommen | 2026-11-12 |
| [0058](0058-owner-badge.md) | Gehört: Initialen am Artikel | angenommen | 2026-11-12 |
| [0059](0059-min-stock.md) | Mindestbestand füllt Nachkaufen | angenommen | 2026-11-12 |
| [0060](0060-one-place-per-action.md) | Eine Stelle pro Aktion im Auswahlmodus | angenommen | 2026-11-12 |
| [0061](0061-recipes-for-selection.md) | Rezepte zur Auswahl auf «Verarbeiten» | angenommen | 2026-11-12 |
| [0062](0062-date-from-photo.md) | Datum fotografieren | angenommen | 2026-11-12 |
| [0063](0063-pack-left.md) | Packung: was übrig ist | angenommen | 2026-11-12 |
| [0064](0064-fresh-nutrition.md) | Geschätzte Nährwerte für frische Lebensmittel (BLV) | angenommen | 2026-11-12 |
| [0065](0065-ideas-stay-private.md) | Ideen und Vergleiche bleiben privat | angenommen | 2026-11-12 |
| [0066](0066-pack-and-content.md) | Packung und Inhalt | angenommen | 2026-11-12 |
| [0067](0067-inventory-by-kind.md) | Vorrat nach Art | angenommen | 2026-11-12 |
| [0068](0068-read-the-label.md) | Foto aufnehmen liest das Etikett | angenommen | 2026-11-12 |
| [0069](0069-vacation-check.md) | Ferien-Check | angenommen | 2026-11-13 |
| [0070](0070-restock-rhythm.md) | Bald wieder nötig | angenommen | 2026-11-13 |
| [0071](0071-shopping-by-kind.md) | Nachkaufen nach Art | angenommen | 2026-11-13 |
| [0072](0072-batch-add.md) | Mehrere auf einmal | angenommen | 2026-11-13 |
| [0073](0073-attention.md) | Im Blick | angenommen | 2026-11-13 |
| [0074](0074-calm-start.md) | Ruhiger Start | angenommen | 2026-11-13 |
| [0075](0075-one-meaning-per-colour.md) | Eine Bedeutung pro Farbe | angenommen | 2026-11-13 |
| [0076](0076-more-in-groups.md) | «Mehr» in drei Gruppen | angenommen | 2026-11-13 |
| [0077](0077-three-search-hits.md) | Drei Suchtreffer zuerst | angenommen | 2026-11-13 |
| [0078](0078-one-photo-way.md) | Ein Weg für Fotos | angenommen | 2026-11-13 |
| [0079](0079-item-action-first.md) | Auf der Artikelseite zuerst «Verwertet» oder «Entsorgt» | angenommen | 2026-11-13 |
| [0080](0080-own-food-icons.md) | Eigene feine Symbole statt Emojis | angenommen | 2026-11-13 |
| [0081](0081-dark-mode.md) | Dunkelmodus nach Einstellung des Geräts | angenommen | 2026-11-13 |
| [0082](0082-spot-photo-large.md) | Das Foto eines Platzes gross zeigen | angenommen | 2026-11-13 |
| [0083](0083-amount-wheel.md) | Mengen in Gramm und Milliliter auf einem Rad | angenommen | 2026-11-13 |
| [0084](0084-rescue-ritual.md) | Retten als Ritual auf Start | angenommen | 2026-11-13 |
| [0085](0085-package-cooldown.md) | Neue Pakete erst nach drei Tagen | angenommen | 2026-11-13 |
| [0086](0086-app-lock.md) | Optionale App-Sperre mit Face ID, nur auf dem Gerät | angenommen | 2026-11-13 |
| [0087](0087-encrypted-backup.md) | Sicherung mit Passwort verschlüsseln; security.txt | angenommen | 2026-11-13 |
| [0088](0088-page-transitions.md) | Seitenübergänge wie auf dem iPhone | angenommen | 2026-11-13 |
| [0089](0089-feedback-question.md) | Eine Frage nach einer Woche | angenommen | 2026-11-13 |
| [0090](0090-week-review-and-calendar.md) | Wochenrückblick und Kalender-Erinnerung ohne Server | angenommen | 2026-11-13 |
| [0091](0091-edge-swipe-back.md) | Zurückwischen vom linken Rand | angenommen | 2026-11-13 |
| [0092](0092-sidebar-on-large-screens.md) | Seitenleiste auf grossen Bildschirmen | angenommen | 2026-11-14 |
| [0093](0093-sheets-as-dialogs.md) | Sheets als Dialog auf grossen Bildschirmen | angenommen | 2026-11-14 |

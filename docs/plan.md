# FridgeAI – MVP-Plan

> **Status: Entwurf, wartet auf Freigabe durch Alban.** Stand: 6. November 2026.
> Grundlage: [`docs/brief.md`](./brief.md) (vollständiger Build-Brief). Offene Fragen: Abschnitt 8.

---

## 0. Kurzfassung

- **Ausgangslage:** Das Repo ist leer (nur `README.md`). Wir bauen alles neu.
- **12 Schritte in 5 Meilensteinen.** Ein Schritt ist ein Thema, kein einzelner PR. Bei der Vorgabe von < 400 geänderten Zeilen pro PR braucht jeder Schritt 2 bis 5 PRs, insgesamt **rund 40 PRs** bis zum MVP. Das schreibe ich bewusst so hin, damit der Umfang ehrlich ist.
- **Wichtigste Abweichung vom Reihenfolge-Vorschlag im Brief:** Haushalt, Sync, Kostenteilung und Rette-Kreis (also der eigentliche USP) kommen **vor** Barcode, Händler-Import, Einkaufsliste und Rezepte. Begründung:
  1. Sync ist das grösste technische Risiko. Je früher er läuft, desto billiger sind Korrekturen am Datenmodell.
  2. Die Basis-Features sind Red Ocean. Pilot-WGs sollen früh das testen, womit FridgeAI gewinnen will.
  3. Nach Schritt 8 ist ein **Pilot-Alpha** mit 1 bis 2 WGs möglich: Vorrat, Bon-Scan, Haushalt, Kostenteilung.
  - *Bedingung:* Der Backend-Entscheid (Frage 1) fällt spätestens am Ende von Meilenstein B. Wenn nicht, tausche ich Meilenstein C und D. Der Plan funktioniert in beiden Reihenfolgen.

| Meilenstein | Schritte | Ergebnis |
| --- | --- | --- |
| **A – Fundament** | 1–2 | Monorepo, CI, Domänenmodell, Geld-/Datumslogik, Haltbarkeit |
| **B – Lokaler Vorrat & Bon-Scan** | 3–6 | Offline-Vorrat ohne Konto, Bon-Foto → Review → Vorrat, Status und CHF-Zähler |
| **C – Haushalt & USP** | 7–8 | Konto, Haushalt, Sync, Besitz, Kostenteilung, Rette-Kreis → **Pilot-Alpha** |
| **D – Basis komplett** | 9–11 | Barcode, Migros-CSV/Coop-PDF, Einkaufsliste, Rezepte |
| **E – Release-Reife** | 12 | Erinnerungen/Push, PWA, Export/Löschen, Datenschutz, Entitlements → **Pilot mit 3–5 WGs** |

---

## 1. Leitplanken, die alle Schritte prägen

Das sind kleine bis mittlere Entscheide, die ich selbst treffe und als ADR festhalte. Wenn du bei einem Punkt anders denkst, sag es jetzt, später wird es teurer.

1. **Local-first und sync-fähig ab Tag 1.** Jede Zeile hat eine clientseitig erzeugte **UUIDv7**, eine `householdId`, `updatedAt` und `deletedAt` (Soft-Delete). Beim ersten Start legt die App still einen lokalen Haushalt «Mein Haushalt» mit einem lokalen Mitglied an. So muss für den Sync später nichts umgebaut werden.
2. **Konflikte: last-write-wins pro Feld, aber mit Hybrid Logical Clock (HLC) statt Gerätezeit.** Handy-Uhren gehen falsch. Eine HLC ordnet Änderungen trotzdem korrekt. Details folgen im Sync-ADR (Schritt 7).
3. **Geld nur als Integer-Rappen** (eigener Typ `Rappen`), nie als Float. Aufteilungen mit Largest-Remainder-Verfahren, deterministisch. Invariante: Die Summe aller Salden ist immer 0. Getestet mit Property-Tests.
4. **Ablaufdatum ist ein Kalendertag, kein Zeitpunkt.** Gespeichert als `YYYY-MM-DD` (Europe/Zurich). Zeitpunkte wie `purchasedAt` bleiben ISO-UTC. So gibt es kein «läuft gestern ab» wegen Zeitzonen.
5. **`packages/core` bleibt rein:** kein DOM, kein IndexedDB, kein `fetch`. Alles Äussere läuft über Ports (Interfaces) mit Adaptern in `apps/web`.
6. **Kein Bild verlässt das Gerät.** OCR-Modell (`deu`), Tesseract-Worker und PDF-Worker werden **selbst gehostet** und vom Service Worker gecacht, nicht von einem CDN geladen (sonst sieht ein Dritter die IP-Adressen der Nutzer:innen).
7. **UI-Texte in einem typisierten Katalog** (`messages.de-CH.ts`) ohne i18n-Bibliothek. Französisch kommt in v1 dazu, dann wird das ein reiner Austausch.
8. **Kein Error-Tracking und keine Analytics im MVP.** Fehler sieht man lokal in einer Diagnose-Ansicht, die Nutzer:innen bei Bedarf selbst teilen können.
9. **Routing:** React Router im SPA-Modus (Capacitor-tauglich, bekannt, wenig Zeremonie).
10. **Paketmanager pnpm, Node-LTS 24** (in Schritt 1 verifiziert; `.nvmrc` und CI identisch).

---

## 2. Datenmodell: Verfeinerungen zum Brief

Der Brief (§4) ist der Startpunkt. Diese Änderungen schlage ich vor. Sie landen in Schritt 2 in `packages/core/src/model.ts`.

| Bereich | Brief | Vorschlag | Warum |
| --- | --- | --- | --- |
| Ablauf | `expiresAt` (Zeitpunkt) | `expiresOn: LocalDate` (`YYYY-MM-DD`) | Kein Off-by-one durch Zeitzonen |
| Datumsart | – | `Category.dateKind: 'best_before' \| 'use_by'` | **Lebensmittelsicherheit:** «Schauen, Riechen, Probieren» gilt nur fürs MHD. Bei «zu verbrauchen bis» (Hackfleisch, Fisch, Geflügel) zeigt die App eine klare Warnung und schlägt nichts «über dem Datum» vor |
| Bon-Zeilen | `isFood: boolean` | `kind: 'item' \| 'discount' \| 'deposit' \| 'bag' \| 'subtotal' \| 'total' \| 'payment' \| 'other'` plus `isFood` | Rabatt und Pfand gehören zu einer Position. Für die Kostenteilung zählt auch Non-Food |
| Positionsdetails | `quantity`, `priceRappen` | plus `unitPriceRappen?`, `weightGrams?`, `discountRappen` | Gewichtsartikel, Aktionen, Mehrfachmengen |
| Teilmengen | WasteEvent ohne Menge | `WasteEvent.quantity`; Artikel bleibt mit Restmenge aktiv | US-06 «ganz oder teilweise» |
| Rette-Kreis | `sharedInRescueCircle: boolean` | Eigene Entität `RescueOffer { itemId, offeredBy, offeredAt, claimedBy?, claimedAt?, withdrawnAt? }` | Wer hat übernommen, Rückzug möglich, keine Doppelzählung |
| Mitglied | ohne Konto-Bezug | `Member.userId?`, `Member.leftAt?` | Lokales Profil ohne Konto; Austritt mit offenem Saldo |
| Geteilte Kosten | `assignedTo: 'shared'` | Beim Speichern wird `splitAmong: memberId[]` als Snapshot abgelegt | Saldo ändert sich nicht rückwirkend, wenn jemand ein- oder austritt |
| Ausgleich | «setzt Salden zurück» | `Settlement` bleibt eine Buchung; Saldo = Bon-Anteile − Ausgleiche | Nichts wird gelöscht, alles bleibt nachvollziehbar |
| Lernende Zuordnung | – | `ProductAlias { retailer, normalizedText, productId?, categoryId, hits }` | Korrekturen in der Review merken (US-19) |
| Erinnerungen | – | `ReminderPrefs { memberId, daysBefore: number[] }`, Default `[3, 1]` | US-05 |
| Sync | `updatedAt`, `deletedAt` | intern zusätzlich HLC pro Feld und lokale Outbox-Tabelle | Robuste Konfliktauflösung |

Weiterhin gilt: **Salden und Food-Waste-Metriken werden berechnet, nicht gespeichert** (pure functions in `core`).

---

## 3. Ergänzte User Stories (Vorschläge, bitte bestätigen)

- **US-13 Manuell erfassen** *(Vorschlag)*: Als Nutzer:in tippe ich einen Namen. Die App vervollständigt aus Kategorien und bekannten Produkten und schlägt Lagerort und Ablauf vor. Speichern geht in höchstens 3 Taps.
- **US-14 Artikel verschieben** *(Vorschlag)*: Wenn ich etwas vom Kühlschrank in den Tiefkühler lege, berechnet die App das Ablaufdatum neu (als «geschätzt» markiert). Umgekehrt beim Auftauen ebenso.
- **US-15 Start ohne Konto** *(Vorschlag)*: Beim ersten Start komme ich ohne Registrierung direkt in die App. Wenn ich später einen Haushalt erstelle oder einem beitrete, fragt die App, ob mein bisheriger Vorrat mitkommt.
- **US-16 MHD vs. Verbrauchsdatum** *(Vorschlag)*: Bei MHD-Artikeln nach Ablauf zeigt die App «Oft noch gut: schauen, riechen, probieren». Bei Verbrauchsdatum-Artikeln zeigt sie «Nicht mehr essen».
- **US-17 Haushalt verlassen** *(Vorschlag)*: Ich kann einen Haushalt verlassen. Offene Salden werden vorher angezeigt. Meine Artikel werden «geteilt» oder gelöscht (ich wähle). Owner können Mitglieder entfernen und Einladungen widerrufen.
- **US-18 Offline gleichzeitig ändern** *(Vorschlag)*: Wenn zwei Personen offline denselben Artikel ändern, gewinnt pro Feld die spätere Änderung. Niemand verliert ganze Datensätze.
- **US-19 Lernende Zuordnung** *(Vorschlag)*: Wenn ich in der Bon-Review «M-BUDGET VOLLMILCH» auf «Milch» korrigiere, schlägt die App das beim nächsten Bon automatisch vor.
- **US-20 Rückgängig** *(Vorschlag)*: Statuswechsel («weggeworfen» aus Versehen) kann ich während 10 Sekunden per Toast und danach im Verlauf rückgängig machen.

---

## 4. Die 12 Schritte

Legende Delegation: **O** = Opus (ich), **S** = Sonnet-Subagent (`implementer`), **H** = Haiku-Subagent (`helper`). Ich reviewe jedes Ergebnis selbst (Diff, Tests, Typecheck, Akzeptanzkriterien).

### Schritt 0 – Planung (dieser Branch)
`docs/plan.md`, `docs/brief.md`, `CLAUDE.md` (Kurzfassung), `.claude/agents/*`, ADR-0001. Nur Doku, kein Code.

---

### Meilenstein A – Fundament

#### Schritt 1 – Monorepo, Tooling, CI
- **Ziel:** Leeres, aber vollständig grünes Gerüst. Jeder spätere PR hat Lint, Typecheck, Tests, Build und E2E.
- **PRs:**
  - 1a: pnpm-Workspaces, `tsconfig.base.json` (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), ESLint (flat config, typescript-eslint, kein `any`), Prettier, Vitest mit Coverage, `packages/core` mit einem Beispieltest, `.nvmrc`, `.env.example`
  - 1b: `apps/web` mit Vite, React, Tailwind, React Router, `vite-plugin-pwa` (Minimal-Manifest), Testing Library, Playwright-Smoke-Test inkl. axe-Check
  - 1c: `.github/workflows/ci.yml` (gemäss Brief §10), Dependabot (npm + Actions), PR-Template «Was, Warum, Wie getestet» mit DoD-Checkliste, ADR-0002 (Stack)
- **Delegation:** H für Konfiguration und Boilerplate, O für tsconfig/ESLint-Regeln und CI-Review.
- **Fertig, wenn:** CI auf einem Test-PR grün; `pnpm lint | typecheck | test | build | e2e` laufen lokal und in CI.

#### Schritt 2 – Core-Domäne
- **Ziel:** Das Herz der App als reines, gut getestetes TypeScript.
- **PRs:**
  - 2a: `model.ts` und Zod-Schemas (inkl. Verfeinerungen aus Abschnitt 2), UUIDv7-Generator (eigene ~30 Zeilen statt Dependency), Typ `Rappen` mit Parsen/Formatieren (`3.95`, `-.95`, `1'234.50`, `CHF 12.–`)
  - 2b: Datum: `LocalDate`, Europe/Zurich, «Tage bis Ablauf»; **Kategorien-Katalog** (rund 40 Schweizer Alltagskategorien mit `shelfLifeDays` pro Lagerort, `dateKind`, Durchschnittspreis und -gewicht, Quellen dokumentiert); `estimateExpiry(category, location, purchasedOn)`
  - 2c: Ports: `ReceiptOcrEngine`, `BarcodeScanner`, `ProductCatalog`, `RecipeProvider`, `RebuyProvider`, `DeliveryProvider`, `RetailerReceiptSource`, `SyncAdapter`, `NotificationService`, `Clock`, `IdGenerator`. Mock-Implementierungen für die drei Partner-Ports. ADR-0003 (Local-first, IDs, Soft-Delete), ADR-0004 (Geld in Rappen, Verteilungsregel)
- **Delegation:** O schreibt Modell, Geld, Ports. S recherchiert und entwirft den Kategorien-Katalog, ich prüfe ihn (besonders `use_by`-Kategorien). H schreibt Tabellentests zu fertiger Logik.
- **Tests:** ≥ 95 % Abdeckung; Property-Tests für Rappen-Parsing/-Formatierung.

---

### Meilenstein B – Lokaler Vorrat & Bon-Scan

#### Schritt 3 – Lokaler Vorrat (US-04, US-13, US-14, US-15)
- **PRs:**
  - 3a: Dexie-Schema, Repositories hinter Interfaces, Migrations-Tests (`fake-indexeddb`), automatischer lokaler Haushalt beim ersten Start
  - 3b: App-Shell (untere Navigation: Vorrat · Scannen · Einkaufsliste · Haushalt), Vorrat mit drei Tabs, Sortierung nach Ablauf, Filter «Läuft bald ab», Leerzustände
  - 3c: Manuelle Erfassung mit Autovervollständigung, Bearbeiten, Verschieben mit Neuberechnung (US-14)
  - 3d: Offline-Verhalten (Service Worker cacht App-Shell), In-App-Badge «x laufen bald ab», E2E «Artikel erfassen» und «Offline neu laden»
- **Delegation:** S für 3b bis 3d nach meinen Komponenten-Schnittstellen, O für 3a (Datenschicht ist sync-kritisch).
- **Parallel möglich mit Schritt 4** (andere Pakete).

#### Schritt 4 – Bon-Pipeline in `core` (US-01, Logik)
- **Ziel:** Aus OCR-Text werden saubere `ReceiptLine[]`. Reine Funktionen, keine UI.
- **PRs:**
  - 4a: Normalisierung (Umlaute, Abkürzungen, typische OCR-Verwechslungen wie `0/O`, `1/l`, `,/.`), Händlererkennung über Kopfzeilen-Muster, Zeilenklassifikation (`item`, `discount`, `deposit`, `bag`, `total`, …), Rabatt einer Position zuordnen, Plausibilitätsprüfung «Summe der Positionen = Total»
  - 4b: Migros-Parser + 5 Fixtures
  - 4c: Coop-Parser + 5 Fixtures, generischer Fallback-Parser
  - 4d: Produkt-/Kategorie-Matching (Synonymliste, Trigram-Fuzzy-Match ohne Dependency, `ProductAlias`-Lerntabelle)
- **Fixtures:** synthetisch, OCR-Text statt Bilder, Randfälle Rabatt, Pfand, Gewichtsartikel, Mehrfachmenge, OCR-Fehler, Tragtasche. Keine echten Personendaten (keine Cumulus-/Supercard-Nummern, Filialen generisch).
- **Delegation:** O für Klassifikation, Strategie und Matching; S für die händlerspezifischen Parser nach meinem Interface; H für Fixtures.
- **Tests:** ≥ 90 % Abdeckung. Die Messgrösse «korrekt erkannte Positionen» definiere ich, sobald echte Beispiele vorliegen (Frage 7).

#### Schritt 5 – Bon-Scan-UI mit OCR (US-01)
- **PRs:**
  - 5a: Kamera-Adapter mit allen Zuständen (`unsupported`, `insecure-context`, `prompt`, `granted`, `denied`, `no-device`, `error`), Erklär-Screen vor der Anfrage, `playsinline`, Stream stoppen beim Verlassen und bei `visibilitychange`. Fallbacks: Foto-Upload (`capture="environment"`) und manuelle Erfassung. Anleitung bei `denied` (iOS/Android)
  - 5b: OCR-Worker (tesseract.js, `deu`, selbst gehostet, lazy geladen), Vorverarbeitung im Worker (Graustufen, Kontrast, Zuschnitt, Rotation), Fortschrittsanzeige
  - 5c: Review-Liste: Positionen an-/abwählen (Non-Food abgewählt), Name/Menge/Preis/Lagerort/Ablauf ändern, Warnung bei Summen-Differenz
  - 5d: Übernahme in den Vorrat, Bild sofort verwerfen (Default), Korrekturen fliessen in `ProductAlias`; E2E mit gemocktem OCR, Kamera-Fake-Device und verweigerter Berechtigung
- **Delegation:** S für 5a und 5c, O für 5b (Worker-/Asset-Setup) und 5d.

#### Schritt 6 – Artikel abschliessen & Food-Waste-Zähler (US-06, US-20)
- **PRs:**
  - 6a: `core/metrics`: gerettet/weggeworfen in CHF und kg pro Person und Haushalt, Schätzwerte klar markiert (Preis vom Bon, sonst Kategorien-Durchschnitt)
  - 6b: Aktionen gegessen/weitergegeben/weggeworfen, ganz oder teilweise, Rückgängig, Statistik-Ansicht
- **Delegation:** O für 6a, S für 6b.

**→ Statusmeldung an dich nach Meilenstein B.**

---

### Meilenstein C – Haushalt & USP

#### Schritt 7 – Konto, Haushalt & Sync (US-09, US-15, US-17, US-18)
*Voraussetzung: Fragen 1 bis 3 beantwortet.*
- **PRs:**
  - 7a: ADR Sync: HLC, Feld-LWW, Outbox, Pull mit Cursor, Soft-Delete; Implementierung in `core` (rein, mit Konflikt-Tests)
  - 7b: Backend-Schema, Row-Level-Security «nur eigener Haushalt», Auth (gemäss Frage 2); Infrastruktur als Code im Repo, keine Secrets
  - 7c: `SyncAdapter`-Implementierung im Web, Hintergrund-Sync, Offline-Warteschlange, Anzeige «Zuletzt synchronisiert»
  - 7d: Haushalt erstellen, Einladung per Link/Code (kurz, ablaufend, widerrufbar), Beitritt mit «Vorrat mitnehmen?», Rollen `owner | member`, Verlassen
  - 7e: Besitz pro Artikel, Filter «Meins / Geteilt / Alle»; E2E mit zwei Browser-Kontexten (Einladen, gleichzeitige Änderung)
- **Delegation:** O für 7a, 7b und Review von allem; S für 7d und 7e.
- **Sicherheit:** RLS-Tests (Mitglied A sieht Haushalt B nicht), Einladungscodes nicht erratbar, Rate-Limit.

#### Schritt 8 – Kostenteilung & Rette-Kreis (US-10, US-11)
- **PRs:**
  - 8a: `core/balances`: Anteile pro Position, «geteilt» mit Largest-Remainder (der übrige Rappen rotiert fair), Bon-Rabatte proportional, Salden, Ausgleichsvorschlag mit minimaler Anzahl Zahlungen. Property-Tests: Summe 0, keine Rappen gehen verloren
  - 8b: In der Bon-Review: «bezahlt von» und Zuordnung pro Position (Person/geteilt); Saldo-Ansicht; «Ausgleich erfasst»
  - 8c: Rette-Kreis: freigeben, Benachrichtigung in der App, übernehmen, zurückziehen; Zählung gemäss Frage 8
- **Delegation:** O für 8a vollständig (Geldlogik), S für 8b und 8c.

**→ Pilot-Alpha mit 1–2 WGs möglich. Statusmeldung an dich.**

---

### Meilenstein D – Basis komplett

#### Schritt 9 – Barcode & Open Food Facts (US-03)
- 9a: Barcode-Adapter (nativer `BarcodeDetector`, wo vorhanden, sonst `@zxing/browser`), EAN-13/EAN-8, nutzt den Kamera-Adapter aus 5a
- 9b: `ProductCatalog`-Adapter für Open Food Facts mit lokalem Cache, manuelle Erfassung bei keinem Treffer, «Schon im Vorrat: 2 Stk., läuft am … ab», Quellenangabe gemäss OFF-Lizenz (ODbL)
- **Delegation:** S für beide, O reviewt Datenschutz (Frage 3a).

#### Schritt 10 – Händler-Import Migros-CSV / Coop-PDF (US-02)
- 10a: Migros-CSV-Parser (papaparse) + Fixtures
- 10b: Coop-PDF-Textextraktion (pdfjs-dist, Worker selbst gehostet) + Parser + Fixtures
- 10c: Import-UI, Duplikaterkennung über Bon-Hash/Zeilen-Hash, Default «letzte 14 Tage angehakt», danach dieselbe Review wie beim Foto
- **Delegation:** S für die Parser nach meinem Interface, O für Hash-/Duplikatlogik.
- *Hängt stark von echten Beispieldateien ab (Frage 7).*

#### Schritt 11 – Einkaufsliste & Rezepte (US-07, US-08)
- 11a: Geteilte Einkaufsliste; Abhaken → «In den Vorrat legen?» mit Lagerort- und Ablaufvorschlag
- 11b: `RecipeProvider` mit kuratierter JSON-Sammlung (rund 30 Schweizer Alltagsgerichte, selbst geschrieben, keine kopierten Rezepttexte), Ranking nach bald ablaufenden Zutaten
- 11c: Rezept-Ansicht mit 3 Vorschlägen, fehlende Zutaten mit einem Tipp auf die Liste
- **Delegation:** S für 11a und 11c, O für das Ranking, H für die Rezeptdaten nach Schema (ich prüfe).

**→ Statusmeldung an dich nach Meilenstein D.**

---

### Meilenstein E – Release-Reife

#### Schritt 12 – Erinnerungen, PWA, Datenschutz, Entitlements (US-05, US-12)
- 12a: Erinnerungen: In-App immer; Web Push für installierte PWA, wenn ein Konto besteht (gemäss Frage 3b); klarer Hinweis auf iOS, wenn die App nicht installiert ist; einstellbare Tage
- 12b: Export (JSON und CSV) und Löschen (lokal komplett; Konto und Server-Daten inkl. Regel für Haushalte mit weiteren Mitgliedern)
- 12c: Entitlements `free | pro` als reine Funktion plus Hook; Partner-Mocks sichtbar nur in einer Entwickler-Ansicht
- 12d: PWA-Feinschliff: Icons, Installationshinweis, Offline-Check, Content-Security-Policy, Lighthouse-Check im CI
- 12e: `docs/privacy.md` (Entwurf in einfacher Sprache, von dir/Fachperson zu prüfen), a11y-Durchgang aller Hauptseiten, Pilot-Checkliste und bekannte Einschränkungen
- **Delegation:** S für 12a bis 12d, O für 12b-Löschlogik, CSP und die Datenschutz-Doku, H für Icons und Texte.

**→ MVP fertig, Pilot mit 3–5 WGs.**

---

## 5. Abhängigkeiten zwischen den Schritten

```
1 → 2 → 3 ─┬─→ 5 → 6 → 7 → 8 ─┬─→ 9
           │                  ├─→ 10
      2 → 4┘                  ├─→ 11
                              └─→ 12 (braucht 7 für Push und Server-Löschung)
```
Schritt 3 und 4 laufen parallel. Schritte 9, 10 und 11 sind voneinander unabhängig und können parallel an Subagents gehen.

---

## 6. Risiken und Gegenmassnahmen

| Risiko | Wirkung | Gegenmassnahme |
| --- | --- | --- |
| OCR auf Thermopapier ist ungenau (Knicke, Licht, verblasster Druck) | Bon-Scan, die Kernfunktion, enttäuscht | Vorverarbeitung, händlerspezifische Parser, Summen-Plausibilität, gute Review-UI, lernende Zuordnung. CSV/PDF-Import als zuverlässiger Weg. Server-OCR erst in v1 mit Opt-in |
| Echte Exportformate weichen von Annahmen ab | Import funktioniert bei Pilot nicht | Echte, anonymisierte Beispiele vor Schritt 4 und 10 (Frage 7); tolerante Parser mit klaren Fehlermeldungen |
| Sync-Fehler führen zu Datenverlust | Vertrauensverlust | Sync-Logik rein in `core`, Konflikt-Tests, Soft-Delete, Outbox, nie hartes Löschen beim Sync |
| iOS: Web Push nur für installierte PWA | Erinnerungen kommen nicht an | In-App-Badge immer, Installationshinweis, native Local Notifications in v1 (Capacitor) |
| Grösse von tesseract.js und Sprachmodell | Langsamer Start auf alten Handys | Lazy Loading nur im Scan-Bereich, Cache im Service Worker, Bundle-Budget im CI |
| Open Food Facts deckt CH-Eigenmarken lückenhaft ab | Barcode findet nichts | Manuelle Erfassung speichert Barcode lokal, Bon-Matching als Hauptweg |
| MVP-Umfang ist für einen Pilot gross | Pilot startet spät | Pilot-Alpha nach Schritt 8 |

---

## 7. Arbeitsweise

- Branch pro PR (`feat/<schritt>-<thema>`, z. B. `feat/02a-core-model`), PR mit «Was, Warum, Wie getestet» und DoD-Checkliste.
- Subagent-Aufträge enthalten immer: Ziel, Dateien, Typen/Interfaces, Akzeptanzkriterien, was nicht angefasst wird, wie getestet wird.
- Neue Dependencies nur aus der freigegebenen Liste (Frage 6), alles andere frage ich vorher.
- Nach jedem Meilenstein eine Statusmeldung: erledigt, offen, Entscheide nötig.

---

## 8. Offene Fragen an dich

Zu jeder Frage steht meine Empfehlung. Antworten trage ich hier ein und halte grössere Entscheide als ADR fest. **Für den Start von Schritt 1 brauche ich nur die Freigabe des Plans und Frage 6 und 10.** Fragen 1 bis 3 brauche ich bis Ende Meilenstein B, Frage 7 vor Schritt 4.

1. **Backend/Sync und Hosting** (für Haushalt, Kostenteilung, Rette-Kreis, Push)
   - A) **Supabase, verwaltet, Region Zürich** (laut Supabase-Regionsliste `eu-central-2`; prüfe ich vor dem Setup). Postgres, Auth, Row-Level-Security und Realtime aus einer Hand, wenig Betrieb. Haken: Supabase ist ein US-Unternehmen (Auftragsbearbeitungsvertrag nötig, US CLOUD Act als Restrisiko).
   - B) **Selbst betrieben bei einem Schweizer Anbieter** (Postgres plus kleine API, oder selbst gehostetes Supabase). Volle Datenhoheit, aber Betrieb, Backups und Updates liegen bei uns.
   - *Empfehlung:* A für MVP und Pilot. Alles läuft hinter dem `SyncAdapter`, deshalb ist ein späterer Wechsel zu B möglich, ohne die App umzubauen.
   - Zusatzfrage: Wo soll die PWA selbst (statische Dateien) liegen? *Empfehlung:* auch in der Schweiz, damit das Versprechen «Schweizer Hosting» durchgehend stimmt.
2. **Auth-Methode** – *Empfehlung:* Magic Link per E-Mail im MVP (kein Passwort, einfach für WGs). Passkeys als Option in v1, Apple/Google-Login erst mit den nativen Apps (Capacitor).
3. **Daten, die das Gerät verlassen** (neben dem Sync selbst)
   - a) **Open Food Facts:** Beim Barcode-Scan geht die Barcode-Nummer und die IP-Adresse an Open Food Facts (Frankreich). *Empfehlung:* erlaubt, mit Hinweis beim ersten Scan und Schalter in den Einstellungen.
   - b) **Web Push:** Damit eine Erinnerung ankommt, wenn die App zu ist, muss ein Server wissen, wann was abläuft. *Empfehlung:* Push nur für Nutzer:innen mit Konto (der Server hat die Daten durch den Sync ohnehin). Ohne Konto: Erinnerung beim Öffnen der App.
4. **Serverseitiges OCR/LLM-Parsing** – *Empfehlung:* nicht im MVP. Wir messen im Pilot die Qualität von Tesseract auf dem Gerät und entscheiden in v1 (Opt-in, Kosten pro Bon, Datenschutz).
5. **Freemium im MVP** – *Empfehlung:* Im MVP ist alles gratis, nur die Mechanik (`free | pro`) wird gebaut. Preise und Grenzen entscheiden wir nach dem Pilot. Hinweis: CHF 9/Monat aus dem Businessplan liegt klar über ZWIMP (CHF 4.90) und Kühlbär (CHF 3). Ein Haushalts-Abo, das auf alle Mitglieder verteilt wird, könnte das auffangen.
6. **Dependency-Liste zur Freigabe** (alles Open Source, keine kostenpflichtigen Dienste):
   - Laufzeit: `react`, `react-dom`, `react-router`, `zod`, `dexie`, `dexie-react-hooks`, `tailwindcss`, einzelne `@radix-ui/*`-Komponenten, `tesseract.js`, `@zxing/browser`, `pdfjs-dist`, `papaparse`; ab Schritt 7 `@tanstack/react-query` und der Client des gewählten Backends
   - Entwicklung: `typescript`, `vite`, `@vitejs/plugin-react`, `vite-plugin-pwa`, `vitest`, `@vitest/coverage-v8`, `fast-check` (Property-Tests), `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `fake-indexeddb`, `@playwright/test`, `@axe-core/playwright`, `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `prettier`
   - Bewusst **ohne** Dependency selbst gebaut: UUIDv7, Fuzzy-Matching, Datumshilfen, Textkatalog.
7. **Echte Bon-Beispiele** – Kannst du mir 2 bis 3 Migros-CSV-Exporte, 2 bis 3 Coop-Supercard-PDFs und 5 bis 10 Fotos von Migros-/Coop-Bons geben? Ich leite daraus synthetische Fixtures ab. **Die Originale kommen nie ins Repo.** Bitte nicht in ein öffentliches Repo hochladen, sondern hier in der Session teilen.
8. **Regeln für Kostenteilung und Rette-Kreis**
   - a) «Geteilt» heisst: gleichmässig auf alle Mitglieder zum Zeitpunkt des Einkaufs. Andere Schlüssel (z. B. nur zwei von vier Personen) erst in v1? *Empfehlung:* ja.
   - b) Non-Food (WC-Papier, Putzmittel, Tragtasche) kommt **nicht** in den Vorrat, zählt aber **in der Kostenteilung** mit (klassische WG-Kosten). *Empfehlung:* ja.
   - c) Rette-Kreis: Bei Übernahme wechselt der Besitz. Als «gerettet» zählt der Artikel erst, wenn er gegessen wird, damit nichts doppelt zählt. Zusätzlich zeigt die App «x Artikel über den Rette-Kreis übernommen». Das weicht leicht von US-11 ab («zählt bei Übernahme»). *Empfehlung:* so umsetzen.
9. **Reihenfolge** – Einverstanden, dass Haushalt/Sync/Kostenteilung (Schritte 7 bis 8) vor Barcode, Import, Einkaufsliste und Rezepte kommen, und dass wir nach Schritt 8 einen Pilot-Alpha mit 1 bis 2 WGs machen?
10. **Das Repo `BanioX/FridgeAI` ist öffentlich.** Plan, Brief, Preisüberlegungen und Strategie wären damit für alle sichtbar, auch für ZWIMP und Kühlbär. *Empfehlung:* Repo auf privat stellen. Falls du es bewusst offen willst (Open Source), brauchen wir eine Lizenz. **Bis du antwortest, pushe ich nichts.**

| Nr. | Thema | Antwort |
| --- | --- | --- |
| 1 | Backend/Sync & Hosting | offen |
| 2 | Auth-Methode | offen |
| 3 | Daten, die das Gerät verlassen | offen |
| 4 | Serverseitiges OCR/LLM | offen |
| 5 | Freemium im MVP | offen |
| 6 | Dependency-Liste | offen |
| 7 | Echte Bon-Beispiele | offen |
| 8 | Kostenteilung & Rette-Kreis | offen |
| 9 | Reihenfolge & Pilot-Alpha | offen |
| 10 | Repo öffentlich oder privat | offen |

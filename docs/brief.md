# rettich – Build-Prompt und Analyse-Brief für Claude Code

> Du bist **Claude (Opus, erhöhte Denktiefe)** und arbeitest in **Claude Code** in einem GitHub-Repository. Deine Aufgabe: das **MVP von rettich** planen, architektonisch sauber aufsetzen und in kleinen, prüfbaren Schritten bauen. Auftraggeber und Product Owner ist **Alban Hyseni** (Wirtschaftsinformatik HF, HKV Aarau). Sprache in UI und Doku: **Deutsch (Schweiz)**, also «ss» statt «ß», Du-Form. Code, Bezeichner und Commit-Messages: Englisch.

---

## 0. Wie du arbeitest (zuerst lesen)

1. **Lies dieses Dokument vollständig**, dann das Repo. Erstelle danach einen Plan (`docs/plan.md`) mit Meilensteinen und PR-Schnitten und **lege ihn Alban zur Freigabe vor**, bevor du grössere Mengen Code schreibst.
2. **Kleine Schritte**: jeder Schritt ist ein PR-grosser Change (Richtwert: < 400 geänderte Zeilen, ein klares Thema), mit Tests, grünem CI und kurzer Beschreibung.
3. **Frag Alban vor grossen Entscheiden** (siehe Abschnitt 12). Bei kleinen Entscheiden: entscheide, dokumentiere kurz in `docs/adr/` (Architecture Decision Record) und mach weiter.
4. **Keine erfundenen Integrationen**: Es gibt im MVP **keine echten Partner-Anbindungen** (Migros, Coop, Lieferdienste). Nur abstrahierte Interfaces mit Mock-Implementierungen.
5. **Keine Geheimnisse im Repo.** `.env.example` ja, echte Keys nie.

---

## 1. Produktvision und USP

**Vision (langfristig):** rettich wird das «TWINT des Food-Managements»: die eine zentrale Schweizer App, über die ein Haushalt weiss, was er hat, was er braucht, was bald abläuft und wer was bezahlt hat. Später: Nachkauf über Partner, Lieferdienste, Händler-Integration, und erst ganz am Schluss Hardware (Smart-Fridge-Modul).

**Problem:** Schweizer Haushalte verursachen rund 720'000 t vermeidbare Lebensmittelverluste pro Jahr (BAFU), das sind rund 80 kg bzw. CHF 600 pro Person und Jahr (Kanton Zürich, Facts & Figures 2026).

**Ehrliche Marktlage (Blue-Ocean-Analyse, Stand Nov. 2026):** Die Basis (Vorrat in Kühlschrank/Tiefkühler/Vorrat, Ablauf-Warnungen, Rezepte aus Vorrat, Bon-Scan, Haushalt teilen) ist **Red Ocean**. In der Schweiz gibt es bereits ZWIMP (Migros-CSV- und Coop-PDF-Import) und Kühlbär (Spar-Zähler in CHF, WG-Sharing gratis), international KitchenPal, NoWaste, Fridgely, Samsung Food u. a. Diese Basis muss rettich **mindestens gleich gut** können, gewinnt damit aber nicht.

**Differenzierung (Blue Ocean, nach ERRC):**
- **Kreieren:** Besitz pro Artikel («gehört Alban» / «gehört allen») und **automatische Kostenteilung direkt aus dem Kassenbon** (wer schuldet wem). **Rette-Kreis**: Artikel kurz vor Ablauf an Mitbewohner:innen freigeben. Haushalts-Challenges mit gemessener Wirkung (kg, CHF).
- **Steigern:** Automatik der Erfassung (Bon-Scan als Haupt-Transfermechanismus, abgehakte Einkaufsliste landet im Vorrat), Zusammenarbeit im Haushalt, sichtbare Ersparnis in CHF, Vertrauen (local-first, Schweizer/EU-Hosting, keine Datenverkäufe), MHD-Wissen («Schauen, Riechen, Probieren»).
- **Reduzieren:** manuelles Erfassen pro Artikel (Barcode nur ergänzend), Einstellungen, Rezeptvielfalt (3 gute «Rette-es»-Vorschläge statt Datenbank).
- **Eliminieren (im MVP):** Hardware, Kalorien/Nährwerte, Prospekte/Angebote, eigene grosse Rezeptdatenbank, echte Partner-Integrationen.

**USP in einem Satz:** «Scan deinen Bon – rettich weiss, was ihr habt, wem es gehört, wer was schuldet und was ihr heute retten müsst.»

**Primäre Zielgruppe MVP:** WGs, Paare und junge Haushalte in der Deutschschweiz. Sekundär: Familien.

---

## 2. Kern-Features des MVP

1. **Drei Lagerorte**: `Kühlschrank`, `Tiefkühler`, `Vorratsschrank` (fix, nicht konfigurierbar im MVP).
2. **Bon-Scan (Schlüsselfunktion)**: Foto/Kamera eines Kassenbons (Migros, Coop, generisch) → OCR → Positionen parsen → Produkte zuordnen → Lagerort und Ablaufdatum pro Kategorie schätzen → Nutzer:in korrigiert in einer Review-Liste → Übernahme in den Vorrat. Zusätzlich: Import der **Migros-Cumulus-CSV** und **Coop-Supercard-PDF** (Datei-Upload), weil das reale Exportformate sind.
3. **Barcode-Scan** als Ergänzung (Einzelartikel), Produktdaten via Open Food Facts.
4. **Einkaufsliste**: geteilt im Haushalt; Abhaken kann Artikel direkt in den Vorrat legen.
5. **Ablauf-Erinnerungen**: Liste «Läuft bald ab», Benachrichtigungen (siehe Abschnitt 6, iOS-Einschränkungen).
6. **Rezepte aus dem Vorrat**: 3 Vorschläge, priorisiert nach bald ablaufenden Artikeln. Rezeptquelle hinter einem Interface (`RecipeProvider`); im MVP kleine kuratierte JSON-Sammlung (Schweizer Alltagsgerichte), später LLM oder Partner.
7. **Food-Waste-Metrik**: Status pro Artikel `gegessen | weitergegeben | weggeworfen`; Zähler «gerettet» in CHF und kg pro Person und Haushalt; Preis aus dem Bon, sonst Kategorien-Durchschnitt (klar als Schätzung gekennzeichnet).
8. **Haushalt teilen**: Einladung per Link/Code, Rollen `owner | member`, Besitz pro Artikel, **Kostenteilung** aus Bon-Positionen (Saldo pro Person, «Ausgleichen» markieren; kein echter Zahlungsfluss im MVP).
9. **Rette-Kreis**: Artikel «zum Mitessen freigeben»; Mitglieder sehen und übernehmen es.
10. **Freemium-Vorbereitung**: Feature-Flags/Entitlements (`free | pro`), noch ohne Bezahlung. **Partner-Hooks** nur als Interfaces: `RebuyProvider`, `DeliveryProvider`, `RetailerReceiptSource` mit Mock-Implementierungen.

---

## 3. User Stories mit Akzeptanzkriterien

Format: *Als … möchte ich … damit …* + Akzeptanzkriterien (Given/When/Then). Ergänze fehlende Stories im Plan und markiere sie als Vorschlag.

**US-01 Bon scannen**
Als Haushaltsmitglied möchte ich meinen Kassenbon fotografieren, damit meine Einkäufe ohne Tippen im Vorrat landen.
- Given Kamera-Berechtigung erteilt, When ich einen Migros- oder Coop-Bon fotografiere, Then sehe ich innert vertretbarer Zeit eine Review-Liste mit erkannten Positionen (Name, Menge, Preis).
- Non-Food-Positionen (z. B. Tragtasche, Pfand, Rabattzeilen, Totale) werden erkannt und standardmässig abgewählt.
- Jede Position hat einen vorgeschlagenen Lagerort und ein geschätztes Ablaufdatum, die ich vor dem Speichern ändern kann.
- Ohne Kamera-Berechtigung oder ohne Kamera: Then kann ich ein Foto aus der Galerie hochladen oder manuell erfassen.
- Bilder werden nach der Auswertung **nicht gespeichert** (nur die bestätigten Positionen), ausser ich aktiviere es explizit.

**US-02 Händler-Export importieren**
Als Migros-/Coop-Kund:in möchte ich meine CSV/PDF-Belege importieren, damit mehrere Einkäufe auf einmal übernommen werden.
- Migros-CSV und Coop-PDF werden erkannt; bereits importierte Positionen (gleicher Bon-Hash/Zeile) werden übersprungen.
- Standardmässig sind nur Einkäufe der letzten 14 Tage angehakt.
- Parser sind durch Tests mit anonymisierten Fixture-Dateien abgedeckt.

**US-03 Barcode scannen**
- Given Kamera erlaubt, When ich einen EAN-13/EAN-8 scanne, Then wird das Produkt über Open Food Facts gesucht und vorausgefüllt; bei keinem Treffer manuelle Erfassung mit Barcode gespeichert.
- Scannen eines Produkts, das schon im Vorrat ist, zeigt Menge und Ablaufdatum.

**US-04 Vorrat ansehen**
- Drei Tabs (Kühlschrank, Tiefkühler, Vorratsschrank), Filter «Läuft bald ab», Sortierung nach Ablauf.
- Funktioniert offline.

**US-05 Ablauf-Erinnerung**
- Standard: Erinnerung 3 Tage und 1 Tag vor Ablauf, einstellbar.
- Wenn Push nicht verfügbar (z. B. iOS ohne installierte PWA): Hinweis und In-App-Badge beim Öffnen.

**US-06 Artikel abschliessen**
- Ich markiere einen Artikel als gegessen, weitergegeben oder weggeworfen (ganz oder teilweise); der CHF-/kg-Zähler aktualisiert sich.

**US-07 Rezepte**
- Ich sehe bis zu 3 Rezeptvorschläge, die möglichst viele bald ablaufende Artikel verwenden; fehlende Zutaten kann ich mit einem Tipp auf die Einkaufsliste setzen.

**US-08 Einkaufsliste**
- Geteilte Liste im Haushalt; Abhaken fragt optional «In den Vorrat legen?» mit Lagerort- und Ablauf-Vorschlag.

**US-09 Haushalt und Besitz**
- Ich erstelle einen Haushalt, lade per Link/Code ein, jede:r sieht denselben Vorrat.
- Jeder Artikel hat `owner: memberId | "shared"`; Filter «Meins / Geteilt / Alle».

**US-10 Kostenteilung aus dem Bon**
- In der Bon-Review ordne ich Positionen Personen oder «geteilt» zu; die App berechnet Salden pro Person; «Ausgleich erfasst» setzt Salden zurück. Beträge in CHF mit Rappen-Genauigkeit (Integer-Rappen, keine Floats).

**US-11 Rette-Kreis**
- Ich gebe einen bald ablaufenden Artikel frei; Mitglieder werden benachrichtigt und können ihn übernehmen; bei Übernahme zählt er als «weitergegeben/gerettet».

**US-12 Datenschutz-Kontrolle**
- Ich kann alle meine Daten als JSON/CSV exportieren und mein Konto samt Daten löschen.
- Ohne Konto funktioniert die App lokal auf einem Gerät.

---

## 4. Datenmodell (Startpunkt, im Plan verfeinern)

TypeScript-Typen in `packages/core/src/model.ts`, Validierung mit **Zod**. Geldbeträge als `amountRappen: number` (Integer). Zeitpunkte als ISO-Strings (UTC), Anzeige in Europe/Zurich.

```ts
type StorageLocation = 'fridge' | 'freezer' | 'pantry';
type ItemStatus = 'active' | 'eaten' | 'shared_out' | 'wasted';

interface Household { id: string; name: string; createdAt: string; plan: 'free' | 'pro'; }
interface Member { id: string; householdId: string; displayName: string; role: 'owner' | 'member'; }

interface Product {            // Stammdaten, lokal gecacht
  id: string; name: string; barcode?: string; brand?: string;
  categoryId: string; defaultLocation: StorageLocation; source: 'off' | 'receipt' | 'manual';
}
interface Category {           // steuert Haltbarkeitsschätzung
  id: string; name: string;
  shelfLifeDays: Record<StorageLocation, number | null>;
  avgPriceRappenPerUnit?: number; avgWeightGrams?: number;
}

interface InventoryItem {
  id: string; householdId: string; productId: string;
  location: StorageLocation; quantity: number; unit: 'pcs' | 'g' | 'ml';
  purchasedAt: string; expiresAt: string; expiryEstimated: boolean;
  priceRappen?: number; owner: string | 'shared';
  status: ItemStatus; statusChangedAt?: string;
  receiptLineId?: string; sharedInRescueCircle: boolean;
  updatedAt: string; deletedAt?: string;     // für Sync/Soft-Delete
}

interface Receipt { id: string; householdId: string; retailer: 'migros' | 'coop' | 'other';
  purchasedAt: string; totalRappen: number; source: 'photo' | 'csv' | 'pdf'; hash: string; paidBy?: string; }
interface ReceiptLine { id: string; receiptId: string; rawText: string; name: string;
  quantity: number; priceRappen: number; isFood: boolean; productId?: string; assignedTo: string | 'shared'; }

interface ShoppingListItem { id: string; householdId: string; name: string; productId?: string;
  quantity?: number; checked: boolean; addedBy: string; updatedAt: string; }

interface Settlement { id: string; householdId: string; from: string; to: string; amountRappen: number; createdAt: string; }
interface WasteEvent { id: string; itemId: string; type: 'eaten' | 'shared_out' | 'wasted';
  valueRappen: number; valueEstimated: boolean; grams?: number; at: string; by: string; }
```

Salden und Food-Waste-Metriken werden **berechnet** (pure functions in `core`), nicht gespeichert.

---

## 5. Architektur und Tech-Stack (mit Begründung)

**Empfehlung: installierbare PWA mit Vite + React + TypeScript (strict), später mit Capacitor für iOS/Android verpackt.**

| Bereich | Wahl | Begründung |
| --- | --- | --- |
| Build/UI | Vite, React, TypeScript `strict: true` | Schnell, statischer Build ist direkt Capacitor-tauglich (kein SSR nötig). Next.js nur, falls Alban SEO-Webseiten im selben Repo will → als ADR vorlegen. |
| PWA | `vite-plugin-pwa` (Workbox) | Manifest, Service Worker, Offline-Cache, installierbar. |
| Routing | React Router oder TanStack Router | Client-seitig, Capacitor-kompatibel. |
| State/Daten | **Local-first** mit IndexedDB via **Dexie**; TanStack Query für Server-Sync | App funktioniert offline und ohne Konto; Datenschutz. |
| Sync/Backend (ab v1, im MVP optional) | Hinter `SyncAdapter`-Interface; Vorschlag Supabase (EU-Region) oder selbst gehostetes Postgres | Haushalt-Sharing braucht Server. Konfliktstrategie: last-write-wins pro Feld mit `updatedAt`, Soft-Delete. **Wahl mit Alban klären.** |
| Validierung | Zod | Gemeinsame Schemas für Parser, Storage, API. |
| UI | Tailwind CSS + zugängliche Headless-Komponenten (z. B. Radix) | Schnell, konsistent, a11y. |
| Barcode | `@zxing/browser` (oder `html5-qrcode`), native `BarcodeDetector` wo verfügbar | Läuft im Browser über `getUserMedia`. |
| OCR | **tesseract.js** (Sprache `deu`) im Web Worker, clientseitig | Bilder verlassen das Gerät nicht. Optional später: serverseitiges OCR/LLM-Parsing hinter `ReceiptOcrEngine`, nur mit Opt-in. |
| PDF | `pdfjs-dist` für Coop-PDF-Textextraktion | Clientseitig. |
| CSV | `papaparse` für Migros-CSV | Robust. |
| Produktdaten | Open Food Facts API, Ergebnisse lokal cachen | Offene Datenbank, viele CH-Eigenmarken. |
| Benachrichtigungen | Web Push (installierte PWA), Fallback In-App-Badge; später Capacitor Local Notifications | iOS unterstützt Web Push nur für zum Home-Bildschirm hinzugefügte Web-Apps; deshalb Fallback zwingend. |
| Native (v1) | Capacitor (`@capacitor/camera`, Local Notifications) | Gleiche Codebasis, App-Store-Präsenz. |
| Tests | Vitest + Testing Library, Playwright (E2E inkl. Kamera-Mock) | Siehe Abschnitt 9. |
| Qualität | ESLint, Prettier, `tsc --noEmit`, Husky/lint-staged optional | |

**Schichten:**
- `packages/core`: reines TypeScript, keine UI-/Browser-Abhängigkeit. Modelle, Zod-Schemas, Haltbarkeitsschätzung, Bon-Parser (Migros, Coop, generisch), Produkt-Matching, Salden, Food-Waste-Metriken, Interfaces (`ReceiptOcrEngine`, `BarcodeScanner`, `ProductCatalog`, `RecipeProvider`, `RebuyProvider`, `DeliveryProvider`, `RetailerReceiptSource`, `SyncAdapter`, `NotificationService`). Höchste Testabdeckung.
- `apps/web`: PWA (React). Implementiert Browser-Adapter (Kamera, OCR-Worker, Dexie, Push).
- `apps/mobile` (v1): Capacitor-Projekt, nutzt Build von `apps/web`.

**Kamera und Berechtigungen (essenziell):**
- Kamera nur nach expliziter Nutzeraktion anfragen (`navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })`), vorher kurzer Erklär-Screen.
- Zustände sauber behandeln: `prompt`, `granted`, `denied`, kein Gerät, unsicherer Kontext (nur HTTPS/localhost), iOS-Safari-Eigenheiten (`playsinline`), Stream beim Verlassen stoppen.
- Bei `denied`: Anleitung zum Freigeben in den Einstellungen + Fallback **Foto-Upload** (`<input type="file" accept="image/*" capture="environment">`) und **manuelle Erfassung**.
- `Permissions-Policy`/HTTPS im Deployment prüfen.

**Bon-Pipeline:**
1. Bildvorverarbeitung (Graustufen, Kontrast, Zuschnitt, ggf. Rotation) im Worker.
2. OCR → Textzeilen mit Konfidenz.
3. Händlererkennung (Migros/Coop/sonstig) über Kopfzeilen-Muster.
4. Händlerspezifischer Parser → `ReceiptLine[]` (Name, Menge, Preis), Erkennung von Rabatt-, Pfand-, Total- und Non-Food-Zeilen.
5. Matching auf `Product`/`Category` (Normalisierung von Abkürzungen, Synonymliste, Fuzzy-Match; lernende lokale Zuordnungstabelle aus Korrekturen).
6. Haltbarkeitsschätzung aus Kategorie × Lagerort, als «geschätzt» markiert.
7. Review-UI, Bestätigung, Speichern; Rohbild verwerfen.
Parser und Matching sind **reine Funktionen mit Fixture-Tests** (anonymisierte Beispiel-Bons in `packages/core/test/fixtures/`, keine echten personenbezogenen Daten).

---

## 6. Datenschutz (nDSG / DSGVO)

- **Privacy by Design und by Default** (nDSG Art. 7): local-first, Konto optional, minimale Daten.
- Bon-Bilder werden nicht gespeichert (Default). Kein Tracking ohne Einwilligung, keine Werbe-SDKs, **kein Verkauf von Daten**.
- Hosting in der Schweiz oder EU; Auftragsbearbeiter dokumentieren.
- Datenexport (JSON/CSV) und vollständige Löschung (US-12).
- Datenschutzerklärung in einfacher Sprache als Entwurf in `docs/privacy.md` (durch Alban/Fachperson prüfen lassen; keine Rechtsberatung).
- Haushaltsdaten: Mitglieder sehen nur ihren Haushalt; Row-Level-Security, falls Supabase.
- Sicherheit: Content-Security-Policy, Dependency-Scanning (Dependabot), keine Secrets im Client ausser öffentlichen Keys.

---

## 7. Roadmap

**MVP (Ziel: testbar mit 3 bis 5 echten WGs)**
- Lokaler Vorrat (3 Orte), manuelle Erfassung, Barcode, Bon-Foto-Scan mit Review, Migros-CSV/Coop-PDF-Import
- Haltbarkeitsschätzung, «Läuft bald ab», In-App-Erinnerungen, Web Push wo möglich
- Status gegessen/weitergegeben/weggeworfen, CHF-/kg-Zähler
- Einkaufsliste, 3 Rezeptvorschläge aus kuratierter Sammlung
- Haushalt mit Besitz, Kostenteilung, Rette-Kreis (benötigt Sync → Entscheid mit Alban; Fallback: Sync im MVP minimal)
- Entitlements `free/pro` als Flags, Partner-Interfaces mit Mocks
- Export/Löschen, Datenschutzseite, PWA installierbar

**v1**
- Capacitor-Apps (iOS/Android) mit nativer Kamera und Local Notifications
- Bezahl-Abo (Haushalts-Abo), Onboarding-Optimierung
- Haushalts-Challenges, anonymisierte Wirkungsberichte (Grundlage für Pilotprojekte mit Gemeinden/Arbeitgebern)
- Optional serverseitiges OCR/LLM-Parsing (Opt-in) für bessere Bon-Erkennung
- Französisch (Romandie)

**Vision**
- Händler-Partnerschaften (automatischer Bon-Sync statt Upload, Nachkauf, Lieferdienste) über die bestehenden Interfaces
- B2B2C/White-Label für Händler und Gemeinden
- Hardware-Modul / Smart-Fridge-Anbindung

---

## 8. Repo-Struktur

```
/
├─ CLAUDE.md                     # Kurzfassung dieser Regeln für Claude Code
├─ docs/
│  ├─ plan.md                    # Meilensteine, PR-Schnitte (von dir erstellt, von Alban freigegeben)
│  ├─ adr/                       # Architecture Decision Records (0001-*.md)
│  ├─ privacy.md
│  └─ blue-ocean.md              # Zusammenfassung der Strategie
├─ packages/
│  └─ core/
│     ├─ src/ (model, schemas, receipt/, matching/, shelf-life/, balances/, metrics/, ports/)
│     └─ test/ (unit + fixtures/)
├─ apps/
│  ├─ web/
│  │  ├─ src/ (app/, features/{inventory,scan,receipt,shopping,recipes,household,stats}/, adapters/, ui/)
│  │  ├─ public/ (manifest, icons)
│  │  └─ e2e/ (Playwright)
│  └─ mobile/                    # ab v1 (Capacitor)
├─ .claude/
│  └─ agents/                    # Subagent-Definitionen (siehe Abschnitt 11)
├─ .github/workflows/ci.yml
├─ package.json                  # pnpm workspaces
├─ pnpm-workspace.yaml
├─ tsconfig.base.json            # strict, noUncheckedIndexedAccess
└─ .env.example
```

Paketmanager: **pnpm** mit Workspaces. Node-LTS-Version in `.nvmrc`.

---

## 9. Testing

- **Vitest** für `packages/core` (Ziel ≥ 90 % Zeilenabdeckung für Parser, Matching, Haltbarkeit, Salden, Metriken) und Komponenten-Tests in `apps/web` mit Testing Library.
- **Property-/Tabellen-Tests** für Geldberechnungen (Summen der Salden = 0, Rundung in Rappen).
- **Fixture-Tests** für Bon-Parser: mindestens 5 Migros- und 5 Coop-Beispiele (synthetisch/anonymisiert) plus Randfälle (Rabatt, Pfand, Gewichtsartikel, Mehrfachmenge, OCR-Fehler).
- **Playwright E2E**: Kern-Flows (Artikel erfassen, Bon-Review mit gemocktem OCR-Ergebnis, Ablauf-Liste, Einkaufsliste → Vorrat, Haushalt-Einladung mit zwei Browser-Kontexten). Kamera mit Chromium-Fake-Device (`--use-fake-device-for-media-stream`, `--use-fake-ui-for-media-stream`) bzw. Berechtigung verweigert testen.
- **Lighthouse/PWA-Check** im CI optional (installierbar, offline).
- Accessibility: axe-Checks in Playwright für Hauptseiten.

---

## 10. CI (GitHub Actions) und Definition of Done

**`.github/workflows/ci.yml`** bei Push und PR:
1. Checkout, pnpm + Node einrichten, Cache
2. `pnpm install --frozen-lockfile`
3. `pnpm lint` · `pnpm typecheck` · `pnpm test -- --coverage`
4. `pnpm build`
5. Playwright installieren und `pnpm e2e` (Chromium reicht im MVP)
6. Artefakte: Coverage, Playwright-Report
Zusätzlich Dependabot für npm und Actions.

**Definition of Done (pro PR):**
- [ ] Akzeptanzkriterien der betroffenen User Story erfüllt
- [ ] TypeScript strict ohne `any`-Schlupflöcher, Lint und Typecheck grün
- [ ] Unit-Tests für neue Logik, E2E für neue Kern-Flows, CI grün
- [ ] Offline-Verhalten und Kamera-Fallbacks bedacht
- [ ] Keine personenbezogenen Daten in Logs, Fixtures oder Commits
- [ ] UI-Texte auf Deutsch (CH), «ss», Du-Form; a11y-Basics (Labels, Kontrast, Fokus)
- [ ] Doku/ADR aktualisiert, PR-Beschreibung mit «Was, Warum, Wie getestet»
- [ ] Von dir (Opus) reviewt, auch wenn ein Subagent den Code geschrieben hat

---

## 11. Agent-Orchestrierung (verbindlich)

Du (**Opus**) bist **Planer:in, Architekt:in und Reviewer:in**. Du schreibst kritische Logik selbst und delegierst den Rest. Verwende **keine fest codierten Modell-Versions-IDs**, nur die Aliase `opus`, `sonnet`, `haiku`.

**Aufteilung:**
- **Opus (du):** Plan, Architektur, ADRs, Datenmodell, Interfaces/Ports, Bon-Parser-Strategie, Sync-/Konfliktlogik, Geldberechnung, Sicherheit/Datenschutz, Review jedes Subagent-Ergebnisses, Integration, Kommunikation mit Alban.
- **Sonnet-Subagents (mittlere Aufgaben):** einzelne Features nach klarer Spezifikation (z. B. Bon-Review-Screen, Migros-CSV-Parser nach deinem Interface, Dexie-Repository, Playwright-Flows, Kamera-Adapter mit Fallbacks).
- **Haiku-Subagents (einfache, eng umrissene Aufgaben):** Boilerplate, Konfiguration, einfache UI-Komponenten, Unit-Tests zu fertiger Logik, Fixtures, Doku, Übersetzungstexte, mechanische Refactors, Lint-Fixes.

**Regeln für Delegation:**
1. Jeder Auftrag an einen Subagent enthält: Ziel, betroffene Dateien, Interfaces/Typen, Akzeptanzkriterien, was **nicht** angefasst werden darf, und wie getestet wird.
2. Ein Auftrag = ein kleiner, abgeschlossener Change. Keine offenen «bau mal Feature X».
3. **Prüfe jedes Ergebnis**: Diff lesen, Tests laufen lassen, Typecheck, gegen Akzeptanzkriterien halten. Bei Mängeln: präzises Feedback und erneuter Auftrag oder selbst korrigieren.
4. Parallelisiere nur unabhängige Aufgaben (verschiedene Dateien).
5. Subagents treffen keine Architekturentscheide und fügen keine neuen Dependencies ohne deine Freigabe hinzu.

**Vorschlag für Subagent-Definitionen** (`.claude/agents/`):

```markdown
---
name: implementer
description: Setzt klar spezifizierte, mittelgrosse Features um (UI-Flow, Parser, Adapter) nach Vorgaben des Leads.
model: sonnet
---
Du setzt genau die beschriebene Aufgabe um, hältst dich an CLAUDE.md, schreibst Tests, änderst keine fremden Module und fügst keine Dependencies ohne Freigabe hinzu. Gib am Ende eine kurze Zusammenfassung mit geänderten Dateien und Testergebnis zurück.
```

```markdown
---
name: helper
description: Erledigt einfache, eng umrissene Aufgaben – Boilerplate, einfache Komponenten, Tests zu bestehender Logik, Doku, mechanische Refactors.
model: haiku
---
Du arbeitest nur an den genannten Dateien, befolgst CLAUDE.md, lässt Lint, Typecheck und Tests laufen und meldest Ergebnis und geänderte Dateien zurück.
```

```markdown
---
name: reviewer
description: Zweite Meinung zu Sicherheit, Datenschutz und Testlücken in einem Diff.
model: sonnet
---
Prüfe den Diff auf Fehler, Sicherheits- und Datenschutzprobleme, fehlende Tests und Verstösse gegen CLAUDE.md. Ändere nichts, liefere eine priorisierte Liste.
```

**Arbeitsrhythmus:** Plan → (Freigabe) → Branch pro Schritt → delegieren/umsetzen → verifizieren → PR mit Beschreibung → nächster Schritt. Nach jedem Meilenstein kurze Statusmeldung an Alban: erledigt, offen, Entscheide nötig.

---

## 12. Vor diesen Entscheiden Alban fragen

- Backend/Sync-Anbieter und Hosting-Standort (Supabase EU vs. Schweizer Hoster vs. später)
- Auth-Methode (Magic Link, Passkeys, Apple/Google Login)
- Wechsel von Vite auf Next.js oder anderes Framework
- Serverseitiges OCR/LLM-Parsing (Kosten, Datenschutz)
- Neue grössere Dependencies, kostenpflichtige Dienste
- Preis-/Freemium-Grenzen (Benchmarks: ZWIMP CHF 4.90/Monat, Kühlbär CHF 3/Monat; der Businessplan nennt CHF 9/Monat, was über dem Markt liegt)
- Alles, was Daten das Gerät verlassen lässt
- Abweichungen vom MVP-Umfang

---

## 13. Erster Auftrag

1. Repo analysieren, dann `docs/plan.md` mit 8 bis 12 PR-Schritten erstellen (Reihenfolge-Vorschlag: Monorepo-Setup + CI → core-Modelle/Schemas → Dexie-Storage + Vorrat-UI (3 Orte) → Haltbarkeitsschätzung → Barcode mit Kamera-Fallbacks → Bon-Pipeline (Parser + Fixtures) → Bon-Review-UI mit OCR-Worker → Migros-CSV/Coop-PDF-Import → Einkaufsliste → Status & CHF-Zähler → Rezepte → Haushalt/Sync/Kostenteilung/Rette-Kreis → PWA/Push/Export/Löschen).
2. Offene Fragen aus Abschnitt 12 als nummerierte Liste an Alban.
3. Erst nach Freigabe mit Schritt 1 beginnen.

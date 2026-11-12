# Rettich – MVP-Plan

> **Stand 12.11.2026:** Version 0.14.0, dazu acht Änderungen auf `main`. Meilenstein A und B sind umgesetzt. Aus D und E sind Barcode, die Quittung als PDF, Screenshot und Foto, «Nachkaufen», die Auszüge, Export und Import vorgezogen. Seit 0.11.0 kam der Alltag dazu: Rezepte unter «Wissen» (ADR-0048), Verarbeiten und Reste mit Wert (ADR-0052), Abzeichen (ADR-0054), Töpfe im Auswahlmodus mit einer Stelle pro Aktion (ADR-0055, ADR-0060), Plätze mit Foto und «Wo ist was?» (ADR-0056), die Klimabilanz (ADR-0057), «Gehört» (ADR-0058), der Mindestbestand (ADR-0059), Einräumen nach dem Einkauf, Rezepte zur Auswahl (ADR-0061) und der Kühlschrank-Check Fach für Fach. Meilenstein C (Konto, Sync, Push) ist nicht begonnen. Der Pilot läuft. Stand der Dinge und nächste Schritte: [«Stand nach 200 PRs»](#stand-nach-200-prs).
>
> **Status: freigegeben durch Alban am 6. November 2026** («Du machst das, du bist die volle Pipeline. Ich sage, was wir machen, ausführen tust du.»).
> Grundlagen: [`brief.md`](./brief.md) (Build-Brief), [`blue-ocean.md`](./blue-ocean.md) (Strategie), [`use-cases.md`](./use-cases.md) (Brainstorming), [`architecture.md`](./architecture.md) (Architektur und Skalierung). Offene Fragen: Abschnitt 9.
>
> **Neu in v2:** Plattform-Fähigkeit für API und MCP (Abschnitt 2), Push-Benachrichtigungen früher (Schritt 8), Dashboards in den Schritten 3 und 6, kleine MVP+-Ergänzungen aus den Use Cases, neue Fragen 11 bis 14.

---

## 0. Kurzfassung

- **Ziel des Produkts:** Jede:r im Haushalt sieht, was im Kühlschrank, Tiefkühler und Vorrat liegt. Die App sorgt dafür, dass nichts im Abfall landet. Partner (Händler, Lieferdienste, Gemeinden, KI-Assistenten) können später über API oder MCP andocken und so Einnahmen bringen.
- **Ausgangslage:** Das Repo enthält ausser dieser Doku noch nichts. Wir bauen alles neu.
- **12 Schritte in 5 Meilensteinen.** Ein Schritt ist ein Thema, kein einzelner PR. Bei höchstens 400 geänderten Zeilen pro PR braucht jeder Schritt 3 bis 5 PRs, insgesamt **rund 45 PRs** bis zum MVP.
- **Reihenfolge nach Risiko:** Haushalt, Sync und Push kommen vor Kostenteilung, Barcode, Import, Einkaufsliste und Rezepten. Begründung:
  1. Sync ist das grösste technische Risiko. Je früher er läuft, desto billiger sind Korrekturen am Datenmodell.
  2. Push braucht einen Server und ist eines deiner Hauptziele.
  3. Die Basis-Features sind Red Ocean. Pilot-WGs sollen früh das testen, womit Rettich gewinnen will.
  4. Nach Schritt 9 ist ein **Pilot-Alpha** mit 1 bis 2 WGs möglich: Vorrat, Quittungs-Scan, Haushalt, Push, Kostenteilung, Rette-Kreis.
  - *Bedingung:* Der Backend-Entscheid (Frage 1) fällt spätestens am Ende von Meilenstein B. Wenn nicht, ziehe ich Meilenstein D vor. Der Plan funktioniert in beiden Reihenfolgen.

| Meilenstein | Schritte | Ergebnis |
| --- | --- | --- |
| **A – Fundament** | 1–2 | Monorepo, CI, Domänenmodell, Schnittstelle für API/MCP, Haltbarkeit (**fertig**, ausser 2i) |
| **B – Lokaler Vorrat & Quittungs-Scan** | 3–6 | Offline-Vorrat ohne Konto mit Startseite (was heute zu retten ist), Quittungs-Foto → Review → Vorrat, Status und Wirkungs-Dashboard (**fertig**, ausser Trend, pro Person und Schweizer Durchschnitt in 6c) |
| **C – Haushalt, Push & USP** | 7–9 | Konto, Haushalt, Sync, Push-Erinnerungen, Kostenteilung, Rette-Kreis → **Pilot-Alpha** (**nicht begonnen**) |
| **D – Basis komplett** | 10–11 | Barcode und Quittung als PDF (umgesetzt), Migros-CSV (offen), Einkaufsliste (lokal umgesetzt); Rezepte entfernt (ADR-0040) |
| **E – Release-Reife** | 12 | Export/Löschen, Datenschutz, Entitlements, PWA-Feinschliff → **Pilot mit 3–5 WGs** (12a lokal, 12c teilweise, 12b offen) |

---

## Stand nach 200 PRs

Grosses Review am 8.11.2026, Bericht: [`reviews/2026-11-08-200-prs.md`](./reviews/2026-11-08-200-prs.md). Der Plan oben bleibt der Rahmen. Seit dem Plan sind dazugekommen:

- «Wissen» statt «Kochen» (ADR-0041), Haltbarkeit 1–10 (ADR-0038), «Von der Theke», «Das wirfst du oft weg».
- «Gerettet» nur auf Bestätigung, mit Belohnung und wachsendem Rettich (ADR-0039, ADR-0042, ADR-0043).
- Der mitgelieferte Produktkatalog mit 7'169 Schweizer Produkten (ADR-0045), mehrere Quittungen auf einer Seite (#212), «Wo eingekauft?» und die Laden-Buchstaben.
- Die Auszüge wie ein Kontoauszug (ADR-0030), «Verwertet» und «Entsorgt» statt «Weitergegeben» (ADR-0046), Wischen in beide Richtungen, Auswählen und die Namen wie bei einer Privatbank (ADR-0047).
- Seit 11.11.2026 der Alltag: Abzeichen, Töpfe, Plätze mit Foto, Klimabilanz, «Gehört», Lagerort-Kacheln auf Start, Sicherung mit Erinnerung, Mindestbestand, mehrere Artikel auf einmal ändern, Einräumen, Rezepte zur Auswahl, Check Fach für Fach (ADR-0052 bis ADR-0061). Ideen dazu: [`ideen/alltag-und-ordnung.md`](./ideen/alltag-und-ordnung.md), [`ideen/mitbewerber-apps.md`](./ideen/mitbewerber-apps.md).

**Die nächsten 10 Schritte** sind ein Vorschlag an Alban. Nichts davon kostet Geld oder schickt neue Daten vom Gerät, ausser wo es dasteht.

| # | Schritt | Warum |
| --- | --- | --- |
| 1 | ~~Release 0.11.0 mit `pnpm release`, dann Statusmeldung an Alban~~ erledigt am 8.11.2026 | Seit 0.10.0 waren 26 Änderungen gemergt, die Schwelle liegt bei 10 (ADR-0017). Der Pilot soll einen benannten Stand testen |
| 2 | Quittung: «Vier Schritte pro Artikel» neu auf `main` bauen, danach TD-08 mit der Zeilenliste von Alban | Die Quittung ist der Hauptweg in den Vorrat (Risiko Nr. 1, Erfassungsmüdigkeit) |
| 3 | Mitgelieferten Katalog zuerst auch bei Barcode und Namenssuche nutzen, erst dann Open Food Facts | Weniger Daten verlassen das Gerät, Treffer auch offline und schneller (TD-17). Es entsteht kein neuer Datenfluss |
| 4 | Erinnern ohne Server: Zahl am App-Symbol (Badging API) für «Heute retten» | Geht ohne Konto, Push und Kosten ([`ideen/benachrichtigungen.md`](./ideen/benachrichtigungen.md)) |
| 5 | Bundle-Diät und Budget im CI: jsPDF-Zusätze und `retail-ch.json` aus dem Cache nehmen, Budget für Start-JS und Vorab-Cache | Spart rund 380 kB im Vorab-Cache; das Budget verlangt der Plan (Abschnitt 8) (TD-15, TD-16, TD-18) |
| 6 | Tests für Quittung, Scan und Journal auf Komponentenebene | Heute nur über E2E geprüft, bei belegtem Port fehlt jede Prüfung (TD-19, TD-06) |
| 7 | TD-02 abbauen: Produktsuche und Quittungs-Import nach `packages/core/src/application`, je ein PR | Danach liegen alle Anwendungsfälle in der Logikschicht, Konten und Sync kommen ohne Umbau (ADR-0034) |
| 8 | Werkzeuge: vite-plugin-pwa 2, TypeScript 7 auf einem Probe-Branch, TD-05 entscheiden, alte Branches löschen | Weniger Rauschen und Schulden, alles gratis |
| 9 | Sync-ADR (HLC, Feld-LWW, Outbox mit `commandId`) und die reine Logik in `packages/core` mit Konflikt-Tests | Grösstes technisches Risiko (Abschnitt 0). Öffnet Teilen im Haushalt und Konten nach dem Pilot, ohne Hosting-Kosten. Server und Hosting entscheidet Alban |
| 10 | Datenschutz-Entwurf (`privacy.md`) fachlich prüfen lassen, Kontaktadresse eintragen | Vor jedem öffentlichen Start nötig (Plan 12d). Die Prüfung der Laden-Buchstaben (P24) gehört dazu. Entscheidet Alban |

---

## 1. Leitplanken, die alle Schritte prägen

Kleine bis mittlere Entscheide, die ich selbst treffe und als ADR festhalte. Wenn du bei einem Punkt anders denkst, sag es jetzt, später wird es teurer.

1. **Local-first und sync-fähig ab Tag 1.** Jede Zeile hat eine clientseitig erzeugte **UUIDv7**, eine `householdId`, `updatedAt` und `deletedAt` (Soft-Delete). Beim ersten Start legt die App still einen lokalen Haushalt «Mein Haushalt» mit einem lokalen Mitglied an.
2. **Konflikte: last-write-wins pro Feld mit Hybrid Logical Clock (HLC)** statt Gerätezeit, weil Handy-Uhren falsch gehen können. Details im Sync-ADR (Schritt 7).
3. **Geld nur als Integer-Rappen** (Typ `Rappen`), nie als Float. Aufteilungen mit Largest-Remainder-Verfahren, deterministisch. Invariante: Summe aller Salden = 0, getestet mit Property-Tests.
4. **Ablaufdatum ist ein Kalendertag**, gespeichert als `YYYY-MM-DD` (Europe/Zurich). Zeitpunkte wie `purchasedAt` bleiben ISO-UTC.
5. **`packages/core` bleibt rein:** kein DOM, kein IndexedDB, kein `fetch`. Alles Äussere läuft über Ports mit Adaptern in `apps/web`.
6. **Kein Bild verlässt das Gerät.** OCR-Modell (`deu`), Tesseract- und PDF-Worker werden selbst gehostet und vom Service Worker gecacht, nicht von einem CDN geladen.
7. **UI-Texte in einem typisierten Katalog** (`messages.de-CH.ts`) ohne i18n-Bibliothek. Französisch kommt in v1 dazu.
8. **Kein Error-Tracking und keine Analytics im MVP.** Eine lokale Diagnose-Ansicht, die Nutzer:innen bei Bedarf selbst teilen.
9. **Routing:** React Router im SPA-Modus (Capacitor-tauglich).
10. **pnpm und Node-LTS 24** (in Schritt 1 verifiziert; `.nvmrc` und CI identisch).

---

## 2. Plattform-Fähigkeit: API und MCP von Anfang an mitdenken

**Ziel:** Partner und KI-Assistenten sollen später andocken können, ohne dass wir die App umbauen. Im MVP kostet das wenig, wenn wir den Code von Anfang an richtig schneiden. Nachträglich wäre es ein grosser Umbau.

**Prinzip: eine Schnittstelle, viele Oberflächen.**

```
                         packages/core
        ┌───────────────────────────────────────────────┐
        │  Domäne: Modelle, Regeln, Geld, Haltbarkeit    │
        │  Schnittstelle v1: Commands, Queries (Zod)     │
        │  Domain Events: item.expiring_soon, …          │
        └───────────────────────────────────────────────┘
             ▲              ▲              ▲             ▲
        PWA (MVP)     REST-API (v1)   MCP-Server (v1)  Webhooks (v1)
        lokal/Sync    OpenAPI 3.1     Tools für KI     Events an Partner
                                      (Claude u. a.)
```

1. **Use-Case-Schicht:** Jede Aktion ist ein benannter Command (`inventory.addItem`, `inventory.consume`, `shopping.addItem`, `rescue.offer`) oder eine Query (`inventory.listExpiring`, `stats.waste`, `balances.get`), mit Zod-Schema für Ein- und Ausgabe. Die PWA ruft genau diese auf, nie direkt die Datenbank.
2. **Ein Schema, drei Formate:** Aus denselben Zod-Schemas entstehen später OpenAPI für die REST-API und die Tool-Definitionen für den MCP-Server (Zod 4 erzeugt JSON Schema direkt). Ein Test im MVP stellt sicher, dass das jederzeit funktioniert.
3. **Domain Events:** Jede Änderung erzeugt ein Event (`item.added`, `item.expiring_soon`, `item.consumed`, `item.used_up`, `shopping_list.item_added`, `receipt.imported`, `rescue.offered`). Im MVP treiben sie Push und Dashboards. Später werden daraus Webhooks für Partner, z. B. `item.used_up` → Nachkauf-Angebot.
4. **Idempotenz:** Jeder Command trägt eine `commandId`. Das braucht der Offline-Sync ohnehin, die API bekommt es dadurch gratis.
5. **Partnertaugliche Daten:** GTIN/EAN normalisiert, `externalRefs` pro Händler (Artikelnummern), Einheiten g/ml/Stk., eigene Kategorien mit Zuordnung zu Open-Food-Facts-Kategorien.
6. **Zugriff nur mit Einwilligung:** Partner und KI-Assistenten bekommen Zugriff nur über OAuth mit klaren Rechten (z. B. `inventory:read`, `shopping_list:write`), pro Haushalt erteilt, jederzeit widerrufbar, protokolliert. Kein Verkauf von Einzeldaten.
7. **Versionierung:** Schnittstelle und Events tragen eine Version (`v1`). Breaking Changes nur mit neuer Version.

**Beispiele für spätere MCP-Tools:** `list_expiring_items`, `get_inventory`, `get_balance`, `add_to_shopping_list`, `mark_item_used` (ADR-0046: «verwertet»). Damit geht dann: «Hey Claude, was muss ich heute essen, bevor es abläuft?» Die Smart-Home-Idee aus ATL1 (Alexa, Google Home) und das spätere Hardware-Modul nutzen dieselbe API, sie sind einfach weitere Clients.

**Was davon im MVP gebaut wird:** Punkte 1, 3, 4, 5 vollständig, Punkt 2 als Test, Punkt 6 als Datenmodell (Rechte, Einwilligungen) ohne öffentlichen Endpunkt. REST-API, MCP-Server und Webhooks laufen serverseitig auf den synchronisierten Daten und folgen in v1 (Frage 12).

---

## 3. Datenmodell: Verfeinerungen zum Brief

Der Brief (§4) ist der Startpunkt. Diese Änderungen landen in Schritt 2 in `packages/core/src/model.ts`.

| Bereich | Brief | Vorschlag | Warum |
| --- | --- | --- | --- |
| Ablauf | `expiresAt` (Zeitpunkt) | `expiresOn: LocalDate` (`YYYY-MM-DD`) | Kein Off-by-one durch Zeitzonen |
| Herkunft des Datums | `expiryEstimated: boolean` | `expirySource` (`category_estimate`, `manual`, `gs1_code`, `label_ocr`, `partner`) und `expiryKind` (MHD/Verbrauchsdatum) pro Artikel | Vorausschauend für 2D-Codes, Etikett-Fotos, Partner (ADR-0006) |
| Nährwerte | – | `Product.nutrition` pro 100 g/ml mit Quelle, Nutri-Score, Allergene | Scan übernimmt sie automatisch (Alban, 6.11.2026) |
| Datumsart | – | `Category.dateKind: 'best_before' \| 'use_by'` | **Lebensmittelsicherheit:** «Schauen, Riechen, Probieren» gilt nur fürs MHD. Bei «zu verbrauchen bis» (Hackfleisch, Fisch, Geflügel) klare Warnung |
| Einfrieren | – | `Category.freezable`, Haltbarkeit im Tiefkühler | Einfrier-Tipp (P-03) |
| Reste-Tipps | – | `Category.tips` (Lagerung, Verwertung) | R-04 |
| Grundvorrat | – | `Category.defaultOwner: 'shared' \| 'buyer'` | W-04, weniger Zuordnen |
| Quittungszeilen | `isFood: boolean` | `kind: 'item' \| 'discount' \| 'deposit' \| 'bag' \| 'subtotal' \| 'total' \| 'payment' \| 'other'` plus `isFood` | Rabatt und Pfand gehören zu einer Position. Für die Kostenteilung zählt auch Non-Food |
| Positionsdetails | `quantity`, `priceRappen` | plus `unitPriceRappen?`, `weightGrams?`, `discountRappen` | Gewichtsartikel, Aktionen |
| Produkt | `barcode?` | `gtin?` (normalisiert), `externalRefs?: Record<retailer, string>` | Partner-Matching, Nachkauf |
| Teilmengen | WasteEvent ohne Menge | `WasteEvent.quantity`; Artikel bleibt mit Restmenge aktiv | US-06 «ganz oder teilweise» |
| Rette-Kreis | `sharedInRescueCircle: boolean` | Entität `RescueOffer { itemId, offeredBy, offeredAt, claimedBy?, claimedAt?, withdrawnAt? }` | Wer hat übernommen, keine Doppelzählung |
| Mitglied | ohne Konto-Bezug | `Member.userId?`, `Member.leftAt?` | Lokales Profil ohne Konto; Austritt |
| Geteilte Kosten | `assignedTo: 'shared'` | Snapshot `splitAmong: memberId[]` beim Speichern | Saldo ändert sich nicht rückwirkend |
| Ausgleich | «setzt Salden zurück» | `Settlement` als Buchung; Saldo = Quittungs-Anteile − Ausgleiche | Nachvollziehbar |
| Lernende Zuordnung | – | `ProductAlias { retailer, normalizedText, productId?, categoryId, hits }` | US-19 |
| Erinnerungen | – | `ReminderPrefs { memberId, digestTime, daysBefore[], quietHours, channels }` | Digest, Ruhezeiten |
| Events | – | `DomainEvent { id, type, version, householdId, actor, at, payload }` | Push, Dashboards, später Webhooks |
| Einwilligungen | – | `Grant { householdId, client, scopes[], grantedBy, grantedAt, revokedAt? }` | API/MCP später ohne Umbau |
| Sync | `updatedAt`, `deletedAt` | intern HLC pro Feld, lokale Outbox mit `commandId` | Robuste Konfliktauflösung, Idempotenz |

Weiterhin gilt: **Salden und Food-Waste-Metriken werden berechnet, nicht gespeichert.**

---

## 4. Ergänzte User Stories (Vorschläge)

- **US-13 Manuell erfassen:** Namen tippen, Autovervollständigung aus Kategorien, Verlauf und Standardartikeln; Lagerort und Ablauf vorgeschlagen; höchstens 3 Taps.
- **US-14 Artikel verschieben:** Vom Kühlschrank in den Tiefkühler → Ablauf neu berechnet (als «geschätzt» markiert), auch umgekehrt.
- **US-15 Start ohne Konto:** Direkt in die App ohne Registrierung. Beim Erstellen oder Beitreten eines Haushalts: «Bisherigen Vorrat mitnehmen?»
- **US-16 MHD vs. Verbrauchsdatum:** MHD abgelaufen → «Oft noch gut: schauen, riechen, probieren». Verbrauchsdatum abgelaufen → «Nicht mehr essen».
- **US-17 Haushalt verlassen:** Offene Salden werden vorher angezeigt, eigene Artikel werden «geteilt» oder gelöscht. Owner können Mitglieder entfernen und Einladungen widerrufen.
- **US-18 Offline gleichzeitig ändern:** Pro Feld gewinnt die spätere Änderung, niemand verliert ganze Datensätze.
- **US-19 Lernende Zuordnung:** Korrektur «M-BUDGET VOLLMILCH» → «Milch» wird bei der nächsten Quittung automatisch vorgeschlagen.
- **US-20 Rückgängig:** Statuswechsel 10 Sekunden per Toast, danach im Verlauf rückgängig machbar.
- **US-21 Retten-Digest:** Einmal täglich zur gewählten Zeit eine Zusammenfassung der bald ablaufenden Artikel mit einem Tipp aus «Wissen» (Haltbarkeit, Einfrieren); dringende Fälle (Verbrauchsdatum heute) zusätzlich einzeln; Ruhezeiten werden respektiert.
- **US-22 Kühlschrank-Check:** Einmal pro Woche schlägt die App einen 30-Sekunden-Check vor: Artikel als Karten, wischen «noch da / weg / halb».

Weitere Use Cases (Push-Typen, Dashboards, Partner) stehen in [`use-cases.md`](./use-cases.md).

---

## 5. Die 12 Schritte

Legende Delegation: **O** = Opus (ich), **S** = Sonnet-Subagent (`implementer`), **H** = Haiku-Subagent (`helper`). Ich reviewe jedes Ergebnis selbst (Diff, Tests, Typecheck, Akzeptanzkriterien).

### Schritt 0 – Planung (dieser Branch)
`docs/plan.md`, `docs/brief.md`, `docs/blue-ocean.md`, `docs/use-cases.md`, `CLAUDE.md`, `.claude/agents/*`, ADR-0001. Nur Doku.

---

### Meilenstein A – Fundament

#### Schritt 1 – Monorepo, Tooling, CI
- 1a: pnpm-Workspaces, `tsconfig.base.json` (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), ESLint (flat config, typescript-eslint, kein `any`), Prettier, Vitest mit Coverage, `packages/core` mit Beispieltest, `.nvmrc`, `.env.example`
- 1b: `apps/web` mit Vite, React, Tailwind, React Router, `vite-plugin-pwa` (Minimal-Manifest), Testing Library, Playwright-Smoke-Test inkl. axe-Check
- 1c: `.github/workflows/ci.yml` (gemäss Brief §10), Dependabot (npm + Actions), PR-Template «Was, Warum, Wie getestet» mit DoD-Checkliste, ADR-0002 (Stack)
- 1d: **Design-System** gemäss [`design.md`](./design.md): Farb- und Schrift-Tokens (grün, food-freundlich, elegant), selbst gehostete Schriften, Icons, überarbeitete App-Hülle *(neu, Wunsch Alban 6.11.2026)*
- 1e: UI-Grundbausteine (Button, Karte, Status-Chip, Artikelzeile, Lagerort-Kachel) und Styleguide-Seite (nur im Entwicklungsmodus)
- **Delegation:** H für Konfiguration, O für tsconfig/ESLint-Regeln, CI-Review und das Design-System.
- **Fertig, wenn:** `pnpm lint | typecheck | test | build | e2e` lokal und in CI grün.

#### Schritt 2 – Core-Domäne und Schnittstelle
- 2a: **Geld und IDs**: Typ `Rappen` (Zod-Brand), `parseChf`/`formatChf` für alle Quittungs-Schreibweisen (`3.95`, `-.95`, `1'234.50`, `CHF 12.–`, `0.80-`), `allocate`/`splitEvenly` (Largest Remainder, rotierender Rest-Rappen), UUIDv7 ohne Dependency; Property-Tests; ADR-0003 (Local-first, IDs), ADR-0004 (Geld)
- 2b: `model.ts` und Zod-Schemas für alle Entitäten (inkl. Abschnitt 3), `LocalDate`/`IsoDateTime`
- 2c: Europe/Zurich, «Tage bis Ablauf»; **Kategorien-Katalog** (rund 40 Schweizer Alltagskategorien mit Haltbarkeit pro Lagerort, `dateKind`, `freezable`, Reste-/Lagertipps, Emoji, Durchschnittspreis und -gewicht, Quellen dokumentiert); `estimateExpiry()`
- 2d: Ports (`ReceiptOcrEngine`, `BarcodeScanner`, `ProductCatalog`, `RebuyProvider`, `DeliveryProvider`, `RetailerReceiptSource`, `SyncAdapter`, `NotificationService`, `Clock`, `IdGenerator`), Mocks für die Partner-Ports
- 2e: **Schnittstelle v1**: Command-/Query-Registry mit Zod-Ein-/Ausgabe, Domain Events, `commandId`; Test, der aus der Schnittstelle JSON Schema erzeugt (Beweis für spätere OpenAPI/MCP-Tauglichkeit); ADR-0005 (Contract-first, API/MCP) — umgesetzt: 55 Operationen und 33 Event-Typen (Stand 12.11.2026; neu seit ADR-0061: `recipes.withItems`; neu seit ADR-0059: `products.setMinStock` mit `product.min_stock_set`, `minStock` an `InventoryItemView`, `addedToList` bei `inventory.recordOutcome` und `source` bei `shopping.list`; neu seit ADR-0058: `household.members`/`addMember`/`renameMember`/`removeMember` mit `member.added`/`renamed`/`removed` und `owner` bei `inventory.updateItem`; neu seit ADR-0057: `stats.footprint`; neu seit ADR-0056: `spots.list`/`create`/`update`/`delete` und `products.setSpot` mit `spot.created`/`updated`/`deleted` und `product.spot_set`; neu seit ADR-0054: `inventory.completeCheck` mit `check.completed` und `stats.achievements`; neu seit ADR-0052: `inventory.process` mit `item.processed`; neu seit ADR-0048 Nachtrag: `recipes.create`/`update`/`delete` mit `recipe.created`/`updated`/`deleted`; `recipes.*` waren seit ADR-0040 entfernt und sind seit ADR-0048 wieder da, neu sind `receipts.matchLine`, `receipts.known`, `stats.impact`, `products.wasteHabits` und `inventory.recategorize`) (inkl. `products.setNutrition`/`product.nutrition_set`, `inventory.history`, `inventory.changeOutcome`/`outcome.changed`, `household.import`/`household.imported`, `receipts.import`, `prices.memory`, `reports.build`, `inventory.open`/`item.opened`, `products.lookup`, `products.image`, `products.frequent`, `products.search`, `inventory.updateItem`/`item.updated`, `inventory.deleteItem`/`restoreItem`, `household.export`/`delete`, `inventory.undoOutcome`/`outcome.undone`, Gründe beim Abschliessen)
- 2f: **GS1-Codes lesen** (ADR-0006): EAN/UPC, GS1 DataMatrix und GS1 Digital Link (QR) mit Ablaufdatum (AI 17/15), Charge, Gewicht; vorausschauend für «GS1 Sunrise 2027»
- 2h: **Notvorrat** als vierter Lagerort (ADR-0007): Haltbarkeit bis 100 Jahre, Warnung 90 Tage vorher, Schnellwahl passend zum Zeithorizont (`expiryPresets`), Monats-/Jahresrechnung, Kategorien für gefriergetrocknete Mahlzeiten, Notrationen und Trinkwasser
- 2i: **Scan-Sitzung** für die Modi «Schnell» (erster sicherer Barcode) und «Gründlich» (Packung langsam drehen, bis Barcode und Ablaufdatum über mehrere Bilder bestätigt sind) (offen: weder Logik noch Kamera gebaut)
- 2j: **Öffnungsregel:** `openedOn` und «nach dem Öffnen innert N Tagen» pro Kategorie oder vom Etikett; gültig ist das frühere Datum
- 2g: Ablaufdatum aus Etikett-Text erkennen («zu verbrauchen bis», «mindestens haltbar bis», FR/IT) als Grundlage für «Datum fotografieren» (v1)
- **Delegation:** O für Modell, Geld, Ports und Schnittstelle. S entwirft den Kategorien-Katalog, ich prüfe ihn (besonders Verbrauchsdatum-Kategorien). H für Tabellentests.
- **Tests:** ≥ 95 % Abdeckung, Property-Tests für Rappen.

---

### Meilenstein B – Lokaler Vorrat & Quittungs-Scan

#### Schritt 3 – Lokaler Vorrat und Startseite (US-04, US-13, US-14, US-15)
- 3a: Dexie-Schema, Repositories hinter Interfaces, Event-Log und Outbox lokal, Migrations-Tests (`fake-indexeddb`), automatischer lokaler Haushalt
- 3b: App-Shell (Navigation seit 8.11.2026: **Start · Vorrat · ＋ Erfassen · Wissen · Mehr**, ADR-0031, ADR-0041; vorher stand an vierter Stelle «Kochen»), Vorrat mit **vier Tabs** (Kühlschrank, Tiefkühler, Vorrat, Notvorrat), Sortierung nach Ablauf, Filter «Läuft bald ab»
- 3c: **Startseite «Heute retten»** (UC-01): was heute/morgen abläuft, Wert im Kühlschrank in CHF (UC-03), Badge; Verbrauchsdatum-Warnungen
- 3d: Manuelle Erfassung mit **sinnvollen Mengen** (g, kg, ml, dl, l, Stück, Becher, Packung, Flasche, Dose, Glas, Bund; Packungsgrösse wie «Becher à 180 g»), Autovervollständigung und Standardartikeln (UC-07; umgesetzt: «Schnell erfassen» mit `products.frequent`, ein Tipp speichert wie beim letzten Mal), Bearbeiten, Verschieben mit Neuberechnung; **Datumsfeld gemäss [`design.md`](./design.md#datumsfeld-ablaufdatum)**: Vorschlag vorausgewählt, Schnellwahl passend zum Zeithorizont (Tage bis 50 Jahre), Tippen `dd.mm.yyyy` mit automatischen Punkten und Live-Vorschau, nativer Kalender; Offline-Cache der App-Shell; E2E «Artikel erfassen» und «Offline neu laden»
- **Delegation:** O für 3a (sync-kritisch), S für 3b bis 3d nach meinen Komponenten-Schnittstellen.
- **Parallel möglich mit Schritt 4.**

#### Schritt 4 – Quittungs-Pipeline in `core` (US-01, Logik)
- 4a: Normalisierung (Umlaute, Abkürzungen, OCR-Verwechslungen `0/O`, `1/l`, `,/.`), Händlererkennung, Zeilenklassifikation, Rabatt einer Position zuordnen, Plausibilität «Summe der Positionen = Total» (umgesetzt: allgemeiner Leser `parseReceiptText` für Coop, Migros, Aldi, Lidl, Denner, ADR-0027)
- 4b: Migros-Parser + 5 Fixtures (ersetzt durch den allgemeinen Leser `parseReceiptText`, ADR-0027)
- 4c: Coop-Parser + 5 Fixtures, generischer Fallback-Parser (ersetzt durch den allgemeinen Leser `parseReceiptText`, ADR-0027)
- 4d: Produkt-/Kategorie-Matching (Synonymliste, Trigram-Fuzzy-Match ohne Dependency, `ProductAlias`-Lerntabelle) (umgesetzt: Abgleich zuerst mit dem, was der Haushalt gelernt hat, dann im mitgelieferten Katalog auf dem Gerät, erst dann bei Open Food Facts, ADR-0036, ADR-0045; `ProductAlias` offen)
- **Fixtures:** synthetisch, OCR-Text statt Bilder, Randfälle Rabatt, Pfand, Gewichtsartikel, Mehrfachmenge, OCR-Fehler, Tragtasche. Keine echten Personendaten.
- **Delegation:** O für Klassifikation und Matching, S für die Händler-Parser nach meinem Interface, H für Fixtures.

#### Schritt 5 – Quittungs-Scan-UI mit OCR (US-01)
- 5a: Kamera-Adapter mit allen Zuständen (`unsupported`, `insecure-context`, `prompt`, `granted`, `denied`, `no-device`, `error`), Erklär-Screen vor der Anfrage, `playsinline`, Stream stoppen beim Verlassen; Fallbacks Foto-Upload und manuelle Erfassung; Anleitung bei `denied`
- 5b: OCR-Worker (tesseract.js, `deu`, selbst gehostet, lazy geladen), Vorverarbeitung im Worker, Fortschrittsanzeige
- 5c: Review-Liste: Positionen an-/abwählen (Non-Food abgewählt), alles editierbar, Warnung bei Summen-Differenz
- 5d: Übernahme in den Vorrat, Bild sofort verwerfen, Korrekturen in `ProductAlias`; E2E mit gemocktem OCR, Kamera-Fake-Device und verweigerter Berechtigung
- **Delegation:** S für 5a und 5c, O für 5b und 5d.

#### Schritt 5b – KI-Import «mit eigener KI erfassen» (ADR-0012, Stufe 1) – **am 7.11.2026 aus der App entfernt** (Alban: kaum genutzt, untergräbt Premium)
- Auftrag (Prompt) zum Kopieren mit festem Antwortformat; Parser für die KI-Antwort (Zeilen oder JSON) in `core`, streng geprüft
- «Einfügen» → Review-Liste → übernehmen; derselbe Posteingang wie später MCP und Quittungs-Scan
- Kein Server, keine Kosten für Rettich

#### Schritt 6 – Abschliessen, Bilanz, Kühlschrank-Check (US-06, US-20, US-22)
- 6a: `core/metrics`: gerettet/weggeworfen in CHF und kg pro Person und Haushalt, Schätzwerte klar markiert
- 6b: Abschliessen als «Verwertet» oder «Entsorgt» (ADR-0046) mit **Grund beim Entsorgen** (abgelaufen, verdorben, zu viel gekauft, vergessen, schmeckt nicht), ganz oder teilweise («Weitergegeben» gibt es seit 8.11.2026 nicht mehr, alte Einträge zählen als verwertet): **Anteile ¼ · ½ · ¾ · alles** bei Gramm, Milliliter und einzelnen Stücken, **«1 von 4»** bei Packungen mit mehreren Stück; «Geöffnet» setzt die Öffnungsregel; Rückgängig (umgesetzt, dazu «Journal» unter «Mehr»: Einträge nachträglich ändern oder löschen; Wischen nach links «Verwertet», nach rechts «Entsorgt»)
- 6c: **Wirkungs-Dashboard** (D-01, D-02): Woche/Monat, Trend, pro Person, Vergleich mit dem Schweizer Durchschnitt (D-03); **Kühlschrank-Check** (UC-04) (umgesetzt: Kühlschrank-Check mit «Noch da · Halb · Verwertet · Entsorgt» und «Zurück», ADR-0022; die «Bilanz» des Monats mit zwei Kreisen auf Start und als Auszug, ADR-0046, ADR-0047; «gerettet» nur auf Bestätigung, ADR-0039; offen: Trend, pro Person, Schweizer Durchschnitt)
- **Delegation:** O für 6a, S für 6b und 6c.

**→ Statusmeldung an dich nach Meilenstein B.**

---

### Meilenstein C – Haushalt, Push & USP

#### Schritt 7 – Konto, Haushalt & Sync (US-09, US-15, US-17, US-18)
*Voraussetzung: Fragen 1 bis 3 beantwortet.*
- 7a: ADR Sync (HLC, Feld-LWW, Outbox, Pull mit Cursor, Soft-Delete) und Implementierung in `core` mit Konflikt-Tests
- 7b: **Backend nach ADR-0009, Login nach ADR-0010** (E-Mail/Passwort mit Bestätigung, Google, Apple, Facebook) (Hono + PostgreSQL in Docker wie HUB-042): Schema inkl. Event-Log und `Grant`-Tabelle, Row-Level-Security «nur eigener Haushalt», Magic Link; `docker-compose.yml`, Seed-Skript für Testnutzer; Infrastruktur als Code, keine Secrets
- 7c: `SyncAdapter` im Web, Hintergrund-Sync, Offline-Warteschlange, «Zuletzt synchronisiert»
- 7d: Haushalt erstellen, Einladung per Link/Code (kurz, ablaufend, widerrufbar), Beitritt mit «Vorrat mitnehmen?», Rollen, Verlassen
- 7e: Besitz pro Artikel, Filter «Meins / Geteilt / Alle»; E2E mit zwei Browser-Kontexten
- **Delegation:** O für 7a, 7b und Review, S für 7d und 7e.
- **Sicherheit:** RLS-Tests (Mitglied A sieht Haushalt B nicht), nicht erratbare Einladungscodes, Rate-Limit.

#### Schritt 8 – Push & Erinnerungen (US-05, US-21)
- 8a: `core/reminders`: wer bekommt wann was (Digest, Verbrauchsdatum, Einfrier-Tipp, Wochenrückblick, **Notvorrat-Rotation 3 Monate vorher**), Ruhezeiten, Bündelung; rein und getestet
- 8b: Web Push: Abo-Verwaltung, Versand serverseitig aus den Events (geplanter Job), VAPID-Schlüssel nur im Backend; Einstellungen pro Person
- 8c: Ohne Konto oder ohne Push: Digest beim Öffnen und Badge; **Installationsanleitung für iPhone** (Web Push nur als installierte PWA); E2E für Einstellungen und In-App-Fallback
- **Delegation:** O für 8a und 8b, S für 8c.

#### Schritt 9 – Kostenteilung & Rette-Kreis (US-10, US-11)
- 9a: `core/balances`: Anteile pro Position, «geteilt» mit Largest-Remainder (der übrige Rappen rotiert fair), Quittungs-Rabatte proportional, Salden, Ausgleichsvorschlag mit minimaler Anzahl Zahlungen; Property-Tests
- 9b: In der Quittungs-Review: «bezahlt von», Zuordnung pro Position, Grundvorrat automatisch geteilt (W-04); Saldo-Ansicht; «Ausgleich erfasst»; Push an Betroffene (P-05)
- 9c: Rette-Kreis: freigeben, Push an Mitglieder (P-04), übernehmen, zurückziehen; Zählung gemäss Frage 8
- **Delegation:** O für 9a vollständig (Geldlogik), S für 9b und 9c.

**→ Pilot-Alpha mit 1–2 WGs möglich. Statusmeldung an dich.**

---

### Meilenstein D – Basis komplett

#### Schritt 10 – Barcode & Händler-Import (US-02, US-03)
- 10a: Barcode-Adapter (`barcode-detector` mit ZXing als WebAssembly, selbst gehostet, ADR-0014; umgesetzt: Kamera, Foto, Eintippen, Datum aus GS1-Code) für EAN-13/EAN-8/UPC **und GS1 DataMatrix / QR (Digital Link)**; **Scan-Modi «Schnell» und «Gründlich»** (offen; wählbar, Fortschritt «Barcode ✓ · Datum …», Haptik bei Treffern); enthält der Code ein Ablaufdatum, wird es automatisch übernommen (`expirySource: gs1_code`); nutzt den Kamera-Adapter aus 5a
- 10b: `ProductCatalog`-Adapter für Open Food Facts mit lokalem Cache (umgesetzt: Adapter, 30-Tage-Cache, Fakten am Produkt; Anzeige umgesetzt: Produktseite mit Bild, Marke, Nährwerten, Nutri-Score und Allergenen; Nährwerte auch aus einem Foto); übernimmt **Name, Marke, Packungsgrösse, Nährwerte, Kalorien, Nutri-Score und Allergene** und zeigt sie auf der Produktseite (kein Kalorien-Tagebuch); manuelle Erfassung bei keinem Treffer, «Schon im Vorrat: 2 Stk.», Quellenangabe gemäss OFF-Lizenz (ODbL); optional Open Food Repo (EPFL) als zweite Quelle für Schweizer Produkte, falls API und Bedingungen bestätigt sind (siehe [`data-sources.md`](./data-sources.md))
- 10c: Migros-CSV-Parser (papaparse) + Fixtures (offen)
- 10d: Coop-PDF-Textextraktion (pdfjs-dist, selbst gehostet) + Parser + Fixtures (umgesetzt mit dem allgemeinen Leser: PDF aus der Coop- und Migros-App, ADR-0027, ADR-0028)
- 10e: Import-UI, Duplikaterkennung über Quittungs-/Zeilen-Hash, Default «letzte 14 Tage angehakt», danach dieselbe Review wie beim Foto (umgesetzt: dieselbe Quittung nie doppelt, mehrere Quittungen auf einer Seite prüfen, «Alle übernehmen»)
- **Delegation:** S für Adapter und Parser, O für Hash-/Duplikatlogik und Datenschutz-Review (Frage 3a). *Hängt stark von echten Beispieldateien ab (Frage 7).*

#### Schritt 11 – Einkaufsliste (US-07); Rezepte (US-08) entfernt
- 11a: Geteilte Einkaufsliste; Abhaken → «In den Vorrat legen?»; **Doppelkauf-Warnung** (E-02) (umgesetzt: lokale Liste «Nachkaufen» unter «Mehr» mit Abhaken, Löschen, Doppelkauf-Hinweis und «In den Vorrat legen»; «geteilt» mit Schritt 7)
- 11b: **Am 8.11.2026 entfernt** (ADR-0040), den letzten Stand mit Rezepten hat der Tag v0.9.0. **Am 11.11.2026 zurück** als Abschnitt unter «Wissen», ohne eigenen Tab und ohne «nach dem Kochen abbuchen» (ADR-0048). **Meine Rezepte** (11.11.2026, ADR-0048 Nachtrag): eigene Rezepte schreiben oder einfügen, unter «Wissen › Rezepte», mit «Da / Fehlt», «Heute kochen» und im Export. Ursprünglich: `RecipeProvider` mit kuratierter JSON-Sammlung (rund 30 Schweizer Alltagsgerichte, selbst geschrieben), Ranking nach bald ablaufenden Zutaten; Rezeptidee im Digest (umgesetzt: Schema, Rangfolge nach Dringlichkeit, nie nach dem Verbrauchsdatum, `recipes.suggest`/`recipes.get`, erste Rezepte)
- 11c: **Am 8.11.2026 entfernt** (ADR-0040). Ursprünglich: Rezept-Ansicht mit 3 Vorschlägen, fehlende Zutaten auf die Liste, **nach dem Kochen abbuchen** (R-03) (umgesetzt: «Rette heute» auf «Start» und im Tab «Kochen» mit «Alle Rezepte» und Feierabend-Filter, ADR-0031; Rezeptseite mit «Da» und «Fehlt», Fehlendes auf die Liste, nach dem Kochen abbuchen mit «Alles · Halb · Nichts», ADR-0023)
- **Delegation:** S für 11a und 11c, O für das Ranking, H für Rezeptdaten nach Schema.

**→ Statusmeldung an dich nach Meilenstein D.**

---

### Meilenstein E – Release-Reife

#### Schritt 12 – Datenschutz, Entitlements, PWA (US-12)
- 12a: Export (JSON und CSV) und Löschen (lokal komplett; Konto und Server-Daten inkl. Regel für Haushalte mit weiteren Mitgliedern) (umgesetzt lokal: `household.export`, `household.import` (Export zurückholen, ersetzt alles; nötig vor dem Wechsel auf rettich.app), `household.delete`, Oberfläche unter «Mehr» › «Deine Daten»; vorgezogen für den Pilot)
- 12b: (offen) Entitlements `free | pro` als reine Funktion plus Hook; Partner-Mocks in einer Entwickler-Ansicht
- 12c: PWA-Feinschliff: Icons, Installationshinweis, Offline-Check, Content-Security-Policy, Lighthouse-Check im CI (umgesetzt: Icons, Installationshinweis, CSP mit E2E-Prüfung; offen: Lighthouse im CI, Dunkelmodus)
- 12d: `docs/privacy.md` (Entwurf in einfacher Sprache, von dir/Fachperson zu prüfen), a11y-Durchgang, Pilot-Checkliste, bekannte Einschränkungen (umgesetzt: Entwurf `docs/privacy.md` nach dem tatsächlichen Verhalten der App, Pilot-Checkliste und Grenzen in `docs/pilot.md`; der Entwurf wurde am 8.11.2026 auf den Stand der App nachgeführt)
- **Delegation:** S für 12b und 12c, O für Löschlogik, CSP und Datenschutz-Doku, H für Icons und Texte.

**→ MVP fertig, Pilot mit 3–5 WGs.**

---

## 6. Ausblick v1 (nach dem Pilot, Reihenfolge offen)

- **Öffentliche API (REST, OpenAPI 3.1), MCP-Server und Webhooks** auf Basis der Schnittstelle aus Schritt 2d, mit Einwilligungs-Ansicht pro Haushalt
- **Programm für Gemeinden/Arbeitgeber (Option C):** Challenge-Modus, aggregiertes Wirkungs-Dashboard
- Native Apps mit Capacitor (lokale Benachrichtigungen ohne Server, App-Store-Präsenz)
- Bezahl-Abo, Haushalts-Challenges, «Darf ich?»-Anfrage, Allergene-Filter, Französisch
- Optional serverseitiges OCR/LLM (Opt-in)
- **MCP-Connector für Claude und ChatGPT** (ADR-0012, Stufe 2): Foto in der KI-App → Vorschlag im Rettich-Posteingang → Link «In Rettich öffnen» → bestätigen; dazu Werkzeuge «Was läuft bald ab?», «Rezeptideen», «Auf die Einkaufsliste»
- **Native Apps (Capacitor):** iOS-/Android-Widgets «Heute retten», Kurzbefehle/Siri/Action-Button (App Intents), Haptik
- **Übersetzungen** FR, IT, EN (ADR-0008)
- **Kreise:** Rette-Kreis über den Haushalt hinaus (Haus, Nachbarschaft, Kollektiv), siehe `architecture.md` Abschnitt 6
- **«Datum fotografieren»:** OCR auf dem Gerät liest das Ablaufdatum vom Etikett (`expirySource: label_ocr`, Logik aus 2g)
- Nährwerte pro Kategorie aus der Schweizer Nährwertdatenbank (BLV, offen, lokal mitgeliefert); YAZIO nur über eine Partnerschaft (siehe [`data-sources.md`](./data-sources.md))

---

## 7. Abhängigkeiten zwischen den Schritten

```
1 → 2 → 3 ─┬─→ 5 → 6 → 7 → 8 → 9 ─┬─→ 10
           │                       ├─→ 11
      2 → 4┘                       └─→ 12
```
Schritt 3 und 4 laufen parallel. Schritte 10, 11 und 12 sind voneinander weitgehend unabhängig.

---

## 8. Risiken und Gegenmassnahmen

| Risiko | Wirkung | Gegenmassnahme |
| --- | --- | --- |
| **Erfassungsmüdigkeit** (Risiko Nr. 1 der Analyse) | Vorrat veraltet, Erinnerungen werden wertlos, Nutzer:innen springen ab | Quittungs-Scan und Einkaufsliste als Hauptwege, Standardartikel mit 1 Tap, Kühlschrank-Check, «nach dem Kochen abbuchen» |
| OCR auf Thermopapier ungenau | Quittungs-Scan enttäuscht | Vorverarbeitung, Händler-Parser, Summen-Plausibilität, gute Review, lernende Zuordnung, CSV/PDF-Import als zuverlässiger Weg |
| Echte Exportformate weichen ab | Import scheitert im Pilot | Echte, anonymisierte Beispiele vor Schritt 4 und 10 (Frage 7) |
| Sync-Fehler | Datenverlust, Vertrauensverlust | Sync-Logik rein in `core`, Konflikt-Tests, Soft-Delete, nie hartes Löschen beim Sync |
| iOS: Web Push nur für installierte PWA | Erinnerungen kommen nicht an | Installationsanleitung, In-App-Digest, native App als Ausweg (Frage 11) |
| Zu viele Pushes | Nutzer:innen schalten ab | Digest statt Einzel-Pushes, Ruhezeiten, Bündelung |
| tesseract.js ist gross | Langsamer Start | Lazy Loading, Cache, Bundle-Budget im CI |
| Kopierbarkeit durch ZWIMP/Kühlbär | Vorsprung schmilzt | Tempo, Community (WG-Einladungen), Partner über API/MCP |
| MVP-Umfang gross | Pilot startet spät | Pilot-Alpha nach Schritt 9 |

---

## 9. Offene Fragen an dich

**Delegation (6.11.2026):** Alban gibt die Richtung vor, Claude führt aus. Technische Entscheide treffe ich deshalb selbst nach den Empfehlungen unten und halte sie als ADR fest. Alban frage ich nur noch, wenn (a) er selbst handeln muss (Konten, Zugänge, Quittungs-Beispiele), (b) Kosten entstehen, (c) Daten das Gerät auf eine neue Art verlassen oder (d) sich das Produkt verändert. Das betrifft vor allem die Fragen 1, 3, 7, 11 und 13, die ich rechtzeitig vor Schritt 7 nochmals kurz vorlege.

Zu jeder Frage steht meine Empfehlung. **Für den Start von Schritt 1 brauche ich nur die Freigabe des Plans, Frage 6 und Frage 15.** Fragen 1 bis 3 und 11 brauche ich bis Ende Meilenstein B, Frage 7 vor Schritt 4.

1. **Backend/Sync und Hosting** (für Haushalt, Kostenteilung, Rette-Kreis, Push)
   - A) **Supabase, verwaltet, Region Zürich** (laut Supabase-Regionsliste `eu-central-2`; prüfe ich vor dem Setup). Postgres, Auth, Row-Level-Security und Realtime aus einer Hand. Haken: Supabase ist ein US-Unternehmen (Auftragsbearbeitungsvertrag, US CLOUD Act als Restrisiko).
   - B) **Selbst betrieben bei einem Schweizer Anbieter** (Postgres plus kleine API). Volle Datenhoheit, aber Betrieb, Backups und Updates liegen bei uns.
   - *Empfehlung:* A für MVP und Pilot. Alles läuft hinter dem `SyncAdapter`, ein späterer Wechsel zu B ist möglich. Die PWA selbst ebenfalls in der Schweiz hosten.
   - **Update 6.11.2026:** Alban wünscht Docker/Cloudflare nach dem Muster von HUB-042. Neuer Vorschlag: **B als selbst betriebener Docker-Stack** (Hono + PostgreSQL, ADR-0009) auf Oracle Cloud Always Free (Zürich) oder Albans Server. Hosting entschieden (siehe Tabelle); die Domain kauft Alban erst nach dem Pilot.
2. **Auth-Methode** – **Beantwortet (6.11.2026):** Registrierung wie eine normale App mit E-Mail + Passwort, Google, Apple und Facebook; umgesetzt mit Better Auth (ADR-0010). Passkeys und Magic Link folgen.
3. **Daten, die das Gerät verlassen** (neben dem Sync selbst)
   - a) **Open Food Facts:** Barcode-Nummer und IP-Adresse gehen an Open Food Facts (Frankreich). *Empfehlung:* erlaubt, mit Hinweis beim ersten Scan und Schalter in den Einstellungen.
   - b) **Web Push:** Der Server muss wissen, wann was abläuft. *Empfehlung:* Push nur mit Konto (die Daten sind durch den Sync ohnehin dort). Ohne Konto: Digest beim Öffnen.
4. **Serverseitiges OCR/LLM-Parsing** – **Beantwortet (6.11.2026):** keine KI auf Rettich-Kosten. Der «KI-Import» per Kopieren/Einfügen war im Prototyp und ist seit 7.11.2026 entfernt; MCP-Connector in v1, eigene KI nur über ein Pro-Abo (ADR-0012).
5. **Freemium im MVP** – *Empfehlung:* alles gratis, nur die Mechanik `free | pro` bauen, Preise nach dem Pilot. CHF 9/Monat liegt über ZWIMP (CHF 4.90) und Kühlbär (CHF 3); ein Haushalts-Abo, das auf alle Mitglieder verteilt wird, könnte das auffangen. Weitere Kandidaten für bezahlte Stufen: Büro-Kühlschrank für Teams ([`use-cases.md`](./use-cases.md), Abschnitt 2d), eigene KI (ADR-0012).
6. **Dependency-Liste zur Freigabe** (alles Open Source, keine kostenpflichtigen Dienste):
   - Laufzeit: `react`, `react-dom`, `react-router`, `zod` (v4), `dexie`, `dexie-react-hooks`, `tailwindcss`, einzelne `@radix-ui/*`-Komponenten, `tesseract.js`, `barcode-detector` + `zxing-wasm` (statt `@zxing/browser`, ADR-0014), `pdfjs-dist`, `papaparse`; ab Schritt 7 `@tanstack/react-query` und der Client des gewählten Backends; ab Schritt 8 eine Web-Push-Bibliothek im Backend
   - Entwicklung: `typescript`, `vite`, `@vitejs/plugin-react`, `vite-plugin-pwa`, `vitest`, `@vitest/coverage-v8`, `fast-check`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `fake-indexeddb`, `@playwright/test`, `@axe-core/playwright`, `eslint`, `typescript-eslint`, `eslint-plugin-react-hooks`, `prettier`
   - Design (ergänzt 6.11.2026, delegiert): `@fontsource-variable/fraunces`, `@fontsource-variable/figtree` (OFL, selbst gehostet), `lucide-react` (ISC)
   - Erst in v1: `@modelcontextprotocol/sdk` (MCP-Server)
   - Bewusst **ohne** Dependency selbst gebaut: UUIDv7, Fuzzy-Matching, Datumshilfen, Textkatalog.
7. **Echte Quittungs-Beispiele** – 2 bis 3 Migros-CSV-Exporte, 2 bis 3 Coop-Supercard-PDFs und 5 bis 10 Fotos von Migros-/Coop-Quittungen. Ich leite synthetische Fixtures ab, **die Originale kommen nie ins Repo**. Bitte hier in der Session teilen.
8. **Regeln für Kostenteilung und Rette-Kreis**
   - a) «Geteilt» = gleichmässig auf alle Mitglieder zum Zeitpunkt des Einkaufs; andere Schlüssel erst in v1. *Empfehlung:* ja.
   - b) Non-Food (WC-Papier, Putzmittel) kommt nicht in den Vorrat, zählt aber in der Kostenteilung. *Empfehlung:* ja.
   - c) Rette-Kreis: Bei Übernahme wechselt der Besitz; als «gerettet» zählt der Artikel erst, wenn er gegessen wird (keine Doppelzählung). Weicht leicht von US-11 ab. *Empfehlung:* so umsetzen.
9. **Reihenfolge und Umfang** – Einverstanden mit der Reihenfolge (Haushalt, Push, Kostenteilung vor Barcode, Import, Einkaufsliste, Rezepte), dem Pilot-Alpha nach Schritt 9 und den **MVP+**-Ergänzungen aus [`use-cases.md`](./use-cases.md)?
10. ~~Repo öffentlich oder privat~~ – **beantwortet:** privat (6.11.2026).
11. **Weg für Push-Benachrichtigungen** – PWA mit Web Push funktioniert auf Android gut. Auf dem iPhone nur, wenn die App zum Home-Bildschirm hinzugefügt wurde, und immer nur mit Konto und Server.
    - A) **MVP mit PWA-Push** und guter Installationsanleitung, native Apps in v1.
    - B) **Native App (Capacitor) schon im MVP**: Erinnerungen lokal auf dem Gerät, auch ohne Konto und Server. Kostet mehr Aufwand (2 bis 3 zusätzliche PRs plus Store-Prozess) und ein Apple-Entwicklerkonto (rund 100 Franken pro Jahr) für TestFlight.
    - *Empfehlung:* A. Wir messen im Pilot-Alpha, wie viele iPhone-Nutzer:innen die PWA installieren. Ist das zu wenig, ziehen wir B vor.
12. **API und MCP: wann?** – *Empfehlung:* Im MVP nur die Schnittstelle (Schritt 2d), die Events und das Einwilligungsmodell. REST-API und MCP-Server in v1, sobald es echte Partner-Gespräche gibt. Ausnahme: Wenn ihr für die Schule eine Demo «Claude fragt Rettich» wollt, kann ich einen schreibgeschützten MCP-Server als Zusatzschritt nach Schritt 9 einplanen (2 bis 3 PRs).
13. **«Datenbasierte Insights (anonymisiert)» aus dem Businessplan vs. «kein Verkauf von Daten» aus dem Brief** – *Empfehlung:* Nie Einzeldaten verkaufen oder weitergeben. Erlaubt sind nur aggregierte Wirkungsberichte innerhalb eines Programms (Option C), bei dem Haushalte aktiv mitmachen (Opt-in), mit einer Mindestgruppengrösse, damit niemand erkennbar ist. Das passt zum Vertrauensversprechen und bleibt trotzdem monetarisierbar.
14. **Rahmen**
    - a) ~~Coden weitere Personen mit?~~ **Beantwortet:** Nein, persönliches Projekt von Alban, vorerst One-Man-Show (6.11.2026). Folgen siehe Abschnitt 10.
    - b) Schultermin: Annahme *keiner*, da persönliches Projekt. Falls doch, bitte melden.
    - c) Die Blue-Ocean-Analyse empfiehlt vor dem Code Interviews, Landingpage-Test und Concierge-MVP. Machst du die parallel? Die Schritte 1 bis 6 sind auch ohne diese Ergebnisse sinnvoll; ab Schritt 7 würde ich Erkenntnisse aus Gesprächen mit WGs gern einfliessen lassen.
15. **Merge-Ablauf** (neu, weil One-Man-Show) – Bei rund 45 PRs wirst du sonst zum Flaschenhals.
    - A) Du reviewst und mergst jeden PR selbst.
    - B) Ich merge selbst, sobald CI grün ist und ich den PR reviewt habe. Du prüfst gesammelt bei der Statusmeldung nach jedem Meilenstein und kannst jederzeit eingreifen. PRs, die einen Entscheid aus Abschnitt 9 umsetzen, Geldlogik, Sync, Auth oder Datenschutz betreffen, lege ich dir trotzdem einzeln vor.
    - *Empfehlung:* B.

| Nr. | Thema | Antwort |
| --- | --- | --- |
| 1 | Backend/Sync & Hosting | **Oracle Cloud + Docker** für den Server, erreichbar über Cloudflare Tunnel oder Tailscale Funnel (ADR-0009); PWA und Vorschau-Links auf **Cloudflare** (ADR-0013) |
| 2 | Auth-Methode | **E-Mail/Passwort, Google, Apple, Facebook** (ADR-0010) |
| 3 | Daten, die das Gerät verlassen | teilweise: Open Food Facts erlaubt (ADR-0016, ADR-0025, ADR-0036, SE-01, SE-02); Push offen |
| 4 | Serverseitiges OCR/LLM | **Keine KI auf Rettich-Kosten** (ADR-0012); Stufe 1 am 7.11.2026 entfernt, Bestandesaufnahme per Foto geparkt (P18) |
| 5 | Freemium im MVP | Brainstorming in [`ideen/monetarisierung.md`](./ideen/monetarisierung.md); Pilot ohne Werbung, Entscheid danach |
| 6 | Dependency-Liste | **freigegeben** (delegiert) |
| 7 | Echte Quittungs-Beispiele | offen |
| 8 | Kostenteilung & Rette-Kreis | offen |
| 9 | Reihenfolge & Umfang | **freigegeben** (delegiert) |
| 10 | Repo öffentlich oder privat | **privat** |
| 11 | Push-Weg (PWA oder nativ) | offen |
| 12 | API und MCP: wann | offen |
| 13 | Anonymisierte Insights | offen |
| 14 | Team, Termine, Validierung | a) **One-Man-Show**, b) Annahme: kein Schultermin, c) offen |
| 15 | Merge-Ablauf | **B: Claude merged** nach grüner CI und eigenem Review |

---

## 10. Arbeitsweise

- **Ein-Personen-Projekt:** Alban ist einziger Mensch im Projekt. Deshalb keine Team-Prozesse (CODEOWNERS, Einstiegsdoku für andere, Review-Pflicht durch Zweite). Sicherheitsnetz sind die CI (muss grün sein, Branch-Schutz auf `main`), mein Review jedes Diffs und bei Bedarf der `reviewer`-Subagent als zweite Meinung zu Sicherheit und Datenschutz.
- Branch pro PR (`feat/<schritt>-<thema>`, z. B. `feat/02a-core-model`), PR mit «Was, Warum, Wie getestet» und DoD-Checkliste.
- Subagent-Aufträge enthalten immer: Ziel, Dateien, Typen/Interfaces, Akzeptanzkriterien, was nicht angefasst wird, wie getestet wird.
- Neue Dependencies: kostenlos und Open Source ist freigegeben (Alban, 6.11.2026); ich wähle sie sorgfältig und begründe sie im PR.
- Nach jedem Meilenstein eine Statusmeldung: erledigt, offen, Entscheide nötig.
- **Freigabe (Alban, 6.11.2026):** «Du darfst alles, solange es kostenlos ist.» Kostenlose Dienste, Gratis-Pläne, Open-Source-Dependencies und Tools entscheide ich selbst. Vorher frage ich nur bei Kosten, Preisgrenzen, neuen Wegen, auf denen Nutzerdaten das Gerät verlassen, und grösseren Produktänderungen.
- **Ansprache:** Die App sagt immer «du» zu einer Person, nie «ihr» (Alban, 6.11.2026).
- **Previews (Wunsch Alban, 6.11.2026):** Jede sichtbare UI-Änderung kommt mit einem kleinen Vorschaubild im iPhone-Format (`pnpm preview:shots`), damit Alban das Design laufend beurteilen kann. Zusätzlich hat jeder PR einen Vorschau-Link auf Cloudflare, den Alban am Handy öffnet ([`previews.md`](./previews.md), ADR-0013).

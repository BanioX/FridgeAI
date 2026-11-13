# Rettich – technischer Plan

> **Stand 12.11.2026:** Version 0.17.0. Gebaut sind der lokale Vorrat, die Quittung als PDF, Screenshot und Foto, Barcode, «Nachkaufen», die Auszüge, Export und Import. Seit 0.11.0 kam der Alltag dazu: Rezepte unter «Wissen» (ADR-0048), Verarbeiten und Reste mit Wert (ADR-0052), Abzeichen (ADR-0054), Töpfe im Auswahlmodus mit einer Stelle pro Aktion (ADR-0055, ADR-0060), Plätze mit Foto und «Wo ist was?» (ADR-0056), die Klimabilanz (ADR-0057), «Gehört» (ADR-0058), der Mindestbestand (ADR-0059), Einräumen nach dem Einkauf, Rezepte zur Auswahl (ADR-0061), der Kühlschrank-Check Fach für Fach und «Datum fotografieren» beim Erfassen (ADR-0062). Mit 0.16.0 sind diese Funktionen auf allen Flächen nachgezogen ([`flaechen.md`](flaechen.md)): Klimabilanz, Plätze und «Gehört» im PDF, das Journal rechnet wie die Bilanz, «Kurz erklärt» unter «Wissen», «Wo ist was?» findet Fachnamen und Personen. Neu sind «7 von 10 übrig» für Packungen mit Stückware und die Kategorie Käsescheiben (ADR-0063), geschätzte Nährwerte für Frisches aus der Schweizer Nährwertdatenbank des BLV (ADR-0064); «Von der Theke» wird beim Erfassen gespeichert (ADR-0038). Mit 0.17.0 lässt sich der Ring antippen (ein Stück verwertet, Halten öffnet ein Menü), Käsescheiben zählen als Packung (ADR-0066), und das Repo enthält nur noch, was gebaut ist (ADR-0065). Seit 0.17.0 zeigt der Vorrat seine Artikel auch «Nach Art», mit Kacheln und einem Block pro Art (ADR-0067), und «Foto aufnehmen» liest Quittung oder Etikett einer Packung (ADR-0068). «Nachkaufen» schlägt vor, was nach dem eigenen Rhythmus bald wieder nötig ist (ADR-0070). Alles läuft auf dem Gerät, ohne Konto. Der Pilot läuft.
>
> Dieses Dokument beschreibt, was gebaut ist und nach welchen Leitplanken. Was als Nächstes kommt, steht nicht in diesem Repo. Entscheide stehen in den [ADRs](./adr/), die Architektur in [`architecture.md`](./architecture.md).

---

## Stand nach 200 PRs

Grosses Review am 8.11.2026, Bericht: [`reviews/2026-11-08-200-prs.md`](./reviews/2026-11-08-200-prs.md). Seit dem ersten Plan sind dazugekommen:

- «Wissen» statt «Kochen» (ADR-0041), Haltbarkeit 1–10 (ADR-0038), «Von der Theke», «Das wirfst du oft weg».
- «Gerettet» nur auf Bestätigung, mit Belohnung und wachsendem Rettich (ADR-0039, ADR-0042, ADR-0043).
- Der mitgelieferte Produktkatalog mit 7'169 Schweizer Produkten (ADR-0045), mehrere Quittungen auf einer Seite (#212), «Wo eingekauft?» und die Laden-Buchstaben.
- Die Auszüge wie ein Kontoauszug (ADR-0030), «Verwertet» und «Entsorgt» statt «Weitergegeben» (ADR-0046), Wischen in beide Richtungen, Auswählen und die Namen wie bei einer Privatbank (ADR-0047).
- Seit 11.11.2026 der Alltag: Abzeichen, Töpfe, Plätze mit Foto, Klimabilanz, «Gehört», Lagerort-Kacheln auf Start, Sicherung mit Erinnerung, Mindestbestand, mehrere Artikel auf einmal ändern, Einräumen, Rezepte zur Auswahl, Check Fach für Fach, Datum fotografieren (ADR-0052 bis ADR-0062).

---

## 1. Leitplanken

Kleine bis mittlere Entscheide trifft Claude selbst und hält sie als ADR fest.

1. **Local-first und sync-fähig ab Tag 1.** Jede Zeile hat eine clientseitig erzeugte **UUIDv7**, eine `householdId`, `updatedAt` und `deletedAt` (Soft-Delete). Beim ersten Start legt die App still einen lokalen Haushalt «Mein Haushalt» mit einem lokalen Mitglied an.
2. **Konflikte: last-write-wins pro Feld mit Hybrid Logical Clock (HLC)** statt Gerätezeit, weil Handy-Uhren falsch gehen können.
3. **Geld nur als Integer-Rappen** (Typ `Rappen`), nie als Float. Aufteilungen mit Largest-Remainder-Verfahren, deterministisch. Invariante: Summe aller Salden = 0, getestet mit Property-Tests.
4. **Ablaufdatum ist ein Kalendertag**, gespeichert als `YYYY-MM-DD` (Europe/Zurich). Zeitpunkte wie `purchasedAt` bleiben ISO-UTC.
5. **`packages/core` bleibt rein:** kein DOM, kein IndexedDB, kein `fetch`. Alles Äussere läuft über Ports mit Adaptern in `apps/web`.
6. **Kein Bild verlässt das Gerät.** OCR-Modell (`deu`), Tesseract- und PDF-Worker werden selbst gehostet und vom Service Worker gecacht, nicht von einem CDN geladen.
7. **UI-Texte in einem typisierten Katalog** (`messages.de-CH.ts`) ohne i18n-Bibliothek.
8. **Kein Error-Tracking und keine Analytics im MVP.** Eine lokale Diagnose-Ansicht, die Nutzer:innen bei Bedarf selbst teilen.
9. **Routing:** React Router im SPA-Modus (Capacitor-tauglich).
10. **pnpm und Node-LTS 24** (`.nvmrc` und CI identisch).

---

## 2. Eine Schnittstelle, viele Oberflächen

Die Oberfläche ruft nie direkt die Datenbank auf, sondern benannte Commands und Queries aus `packages/core`. So kommen REST-API und MCP-Server später ohne Umbau dazu (ADR-0005).

```
                         packages/core
        ┌───────────────────────────────────────────────┐
        │  Domäne: Modelle, Regeln, Geld, Haltbarkeit    │
        │  Schnittstelle v1: Commands, Queries (Zod)     │
        │  Domain Events: item.expiring_soon, …          │
        └───────────────────────────────────────────────┘
             ▲              ▲              ▲
        PWA (heute)    REST-API        MCP-Server
        lokal          OpenAPI 3.1     Tools für KI-Assistenten
```

1. **Use-Case-Schicht:** Jede Aktion ist ein benannter Command (`inventory.addItem`, `inventory.recordOutcome`, `shopping.addItem`) oder eine Query (`inventory.list`, `reports.build`), mit Zod-Schema für Ein- und Ausgabe.
2. **Ein Schema, mehrere Formate:** Aus denselben Zod-Schemas entsteht JSON Schema für OpenAPI und MCP-Tools. Ein Test stellt sicher, dass das jederzeit funktioniert.
3. **Domain Events:** Jede Änderung erzeugt ein Event (`item.added`, `item.used_up`, `receipt.imported`).
4. **Idempotenz:** Jeder Command trägt eine `commandId`.
5. **Saubere Produktdaten:** GTIN/EAN normalisiert, Einheiten g/ml/Stk., eigene Kategorien.
6. **Zugriff nur mit Einwilligung:** Fremder Zugriff auf Haushaltsdaten nur mit ausdrücklicher, widerrufbarer Einwilligung pro Haushalt. Kein Verkauf von Einzeldaten.
7. **Versionierung:** Schnittstelle und Events tragen eine Version (`v1`). Breaking Changes nur mit neuer Version.

---

## 3. Arbeitsweise

- **Ein-Personen-Projekt:** Alban ist einziger Mensch im Projekt. Deshalb keine Team-Prozesse (CODEOWNERS, Einstiegsdoku für andere, Review-Pflicht durch Zweite). Sicherheitsnetz sind die CI (muss grün sein, Branch-Schutz auf `main`), mein Review jedes Diffs und bei Bedarf der `reviewer`-Subagent als zweite Meinung zu Sicherheit und Datenschutz.
- Branch pro PR (`feat/<schritt>-<thema>`, z. B. `feat/02a-core-model`), PR mit «Was, Warum, Wie getestet» und DoD-Checkliste.
- Subagent-Aufträge enthalten immer: Ziel, Dateien, Typen/Interfaces, Akzeptanzkriterien, was nicht angefasst wird, wie getestet wird.
- Neue Dependencies: kostenlos und Open Source ist freigegeben (Alban, 6.11.2026); ich wähle sie sorgfältig und begründe sie im PR.
- Nach jedem Meilenstein eine Statusmeldung: erledigt, offen, Entscheide nötig.
- **Freigabe (Alban, 6.11.2026):** «Du darfst alles, solange es kostenlos ist.» Kostenlose Dienste, Gratis-Pläne, Open-Source-Dependencies und Tools entscheide ich selbst. Vorher frage ich nur bei Kosten, neuen Wegen, auf denen Nutzerdaten das Gerät verlassen, und grösseren Produktänderungen.
- **Ansprache:** Die App sagt immer «du» zu einer Person, nie «ihr» (Alban, 6.11.2026).
- **Previews (Wunsch Alban, 6.11.2026):** Jede sichtbare UI-Änderung kommt mit einem kleinen Vorschaubild im iPhone-Format (`pnpm preview:shots`), damit Alban das Design laufend beurteilen kann. Zusätzlich hat jeder PR einen Vorschau-Link auf Cloudflare, den Alban am Handy öffnet ([`previews.md`](./previews.md), ADR-0013).

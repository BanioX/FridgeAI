# ADR-0034: Drei Schichten – Präsentation, Logik, Daten

- **Status:** angenommen
- **Datum:** 2026-11-07

## Kontext

Alban (7.11.2026): «Überlege, ob das Backend später dazukommt. Ich brauche die 3-Schichten-Architektur.» Ein Backend kommt mit Konten und dem geteilten Haushalt (Plan, Schritt 7, ADR-0009). Damit es ohne Umbau dazukommen kann, muss klar sein, welcher Code wohin gehört und wer wen aufrufen darf.

Stand heute: Die Oberfläche spricht nur über die Schnittstelle (ADR-0005), `packages/core` ist rein (ohne Browser und Node). Die Anwendungsfälle (z. B. «Artikel erfassen», «Abschliessen») stehen aber noch in `apps/web/src/data/*-handlers.ts` und rufen dort Dexie direkt auf. Logik und Datenhaltung sind an dieser Stelle vermischt.

## Entscheid

rettich hat drei Schichten. Jede spricht nur mit der darunter, und zwar über einen festgelegten Vertrag.

| Schicht | Aufgabe | Wo heute | Mit Backend |
| --- | --- | --- | --- |
| **1. Präsentation** | Anzeigen, Eingaben, Navigation, Texte | `apps/web/src/app`, `features/`, `ui/` (React) | gleich; dazu die native App (Capacitor), später REST- und MCP-Clients |
| **2. Logik** | Regeln und Anwendungsfälle: Ablauf, «gerettet», Preise, Rezepte, Bon lesen, Berichte | `packages/core` (Modell, Regeln, Schnittstelle, Ports); die Anwendungsfälle noch in `apps/web/src/data/*-handlers.ts` | Anwendungsfälle in `packages/core/src/application`, rein und nur über Ports. Derselbe Code läuft im Browser und auf dem Server. |
| **3. Daten** | Speichern und Laden, Fremddienste | `apps/web/src/data`: Dexie/IndexedDB, Open Food Facts, Bild-Cache | dazu `apps/server`: PostgreSQL (Drizzle), Sync; im Browser zusätzlich ein HTTP-Adapter |

**Verträge zwischen den Schichten:**

- **Präsentation → Logik:** die Schnittstelle `CONTRACT_V1` (Commands und Queries als Zod-Schemas, ADR-0005). Die Oberfläche bekommt die Handler über `AppData` und kennt keine Datenbank.
- **Logik → Daten:** Ports, also TypeScript-Interfaces in `packages/core/src/ports` (heute `ProductCatalog`, `ProductSearch`, `Clock`, `IdGenerator`; neu kommen Speicher-Ports für Vorrat, Abschlüsse, Produkte, Ereignisse und eine Transaktion dazu). Die Datenschicht setzt sie um, einmal mit Dexie, später mit PostgreSQL.

**Regeln, die die CI prüft (`eslint.config.js`):**

1. Präsentation (`features/`, `ui/`) importiert nichts aus `src/data/` und kein `dexie`. Ausgenommen sind Tests und die Verdrahtung in `app/AppData.tsx`.
2. `packages/core` importiert weder React noch Dexie noch etwas aus `apps/`. Browser- und Node-Globals sind dort schon verboten.
3. Die Datenschicht importiert nichts aus der Präsentation.

**Bekannte Kopplung:** `useLiveQuery` aus `dexie-react-hooks` sorgt in 12 Seiten dafür, dass die Oberfläche sich bei Änderungen neu zeichnet. Die Seiten rufen darin nur Schnittstellen-Operationen auf, nie die Datenbank. Mit dem Sync wird es durch ein eigenes Abo auf Domain Events ersetzt.

## Weg dahin (je ein PR, unter 400 Zeilen)

1. Dieses ADR und die Lint-Regeln.
2. Speicher-Ports in `packages/core/src/ports` und Dexie-Adapter dafür.
3. Anwendungsfälle Bereich für Bereich nach `packages/core/src/application`:
   - zuerst Einkaufsliste und Haushalt,
   - dann Vorrat und Abschlüsse,
   - dann Bon, Preise, Rezepte und Berichte.

   Die Handler in `src/data` werden zu dünnen Adaptern. Die bestehenden Tests sichern jeden Schritt ab.

**Stand 7.11.2026:** Schritt 2 ist umgesetzt. Die Speicher-Ports (`ports/storage.ts`) und das Command-Gerüst mit Idempotenz und Ereignissen (`application/command.ts`) liegen in `packages/core`. Dazu gibt es zwei Adapter: `dexieStorage` im Browser und `createMemoryStorage` für Tests. Die Einkaufsliste läuft als erster Bereich in `application/shopping.ts`. Ihre Tests laufen ohne Browser gegen den Speicher im Arbeitsspeicher und mit Dexie (`shopping.dexie.test.ts`).

**Stand 7.11.2026 (Vorrat):** Vorrat, Abschlüsse, Produktsuche per Barcode und die Abfallstatistik liegen in `application/inventory*.ts`, der Export in `application/household.ts`. Die Geräte-Zwischenspeicher für Produktdaten und Bilder sind lesende Ports (`productFacts`, `productImages`); beschrieben werden sie weiter in der Datenschicht. `household.delete` und `household.import` bleiben in `apps/web/src/data/household-handlers.ts`, weil sie die ganze Geräte-Datenbank verwalten (Zwischenspeicher, `meta`-Zeiger). Häufige Produkte, Produktsuche, Bon-Import, Preise, Bericht und Rezepte folgen im nächsten Schritt.
4. Mit Schritt 7: `apps/server` (Hono, Node 24) verdrahtet dieselben Anwendungsfälle mit PostgreSQL-Adaptern. REST-API und MCP entstehen aus der Schnittstelle. Der Browser synchronisiert über einen HTTP-Adapter. Lokal bleibt Dexie (local-first).

## Konsequenzen

- Ein Backend ist ein zusätzlicher Satz Adapter und ein Server, kein Umbau der Oberfläche oder der Regeln.
- Regeln lassen sich ohne Browser testen. Das ist schon heute bei `packages/core` so, später auch für die Anwendungsfälle.
- Etwas mehr Struktur (Ports, Adapter) als heute. Der Gewinn: Gerät und Server rechnen garantiert gleich, zum Beispiel bei «gerettet» und bei Geldbeträgen.
- Grundlage: ADR-0003 (local-first), ADR-0005 (Schnittstelle), ADR-0009 (Backend-Stack).

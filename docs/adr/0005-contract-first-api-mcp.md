# ADR-0005: Contract-first – ein Vertrag für App, API und MCP

- **Status:** angenommen
- **Datum:** 2026-11-06

## Kontext

Alban: FridgeAI soll später über Partner monetarisierbar sein und dafür «MCP- oder API-freundlich» gebaut werden (Plan, Abschnitt 2). Nachträglich eine API über eine App zu legen, die direkt in die Datenbank schreibt, ist ein grosser Umbau.

## Entscheid

1. **Vertrag v1** in `packages/core/src/contract/operations.ts`: Jede Aktion ist ein benannter **Command** (`inventory.addItem`, `inventory.recordOutcome`, `inventory.move`, `shopping.addItem`, `rescue.offer`) oder eine **Query** (`inventory.list`, `inventory.listExpiring`, `shopping.list`, `recipes.suggest`, `stats.waste`) mit Zod-Schemas für Ein- und Ausgabe, einer Kurzbeschreibung (DE/EN) und den nötigen **Scopes**.
2. **Die PWA ruft nur diese Operationen auf**, nie direkt die Datenbank (ab Schritt 3).
3. **Commands tragen eine `commandId`** (UUIDv7): Die Offline-Outbox und spätere API-Aufrufe sind dadurch idempotent.
4. **Domain Events v1** (`contract/events.ts`): versionierte Ereignisse (`item.added`, `item.expiring_soon`, `item.used_up`, `receipt.imported`, `rescue.claimed` …). Im MVP treiben sie Push und Dashboards, später Webhooks für Partner.
5. **`contractJsonSchemas()`** erzeugt aus denselben Schemas JSON Schema. Daraus entstehen in v1 die OpenAPI-Beschreibung der REST-API und die Tool-Definitionen des MCP-Servers. Ein Test stellt sicher, dass das für jede Operation funktioniert.
6. **Stabilität:** Die Liste der Operationen ist per Test festgehalten. Entfernen oder Umbenennen ist ein Breaking Change und braucht eine neue Vertragsversion; Hinzufügen ist erlaubt.

## Konsequenzen

- Jede neue Funktion beginnt mit einem Eintrag im Vertrag (Schema + Scope), dann folgt die Umsetzung.
- Externe Zugriffe (Partner, KI-Assistenten) brauchen eine Einwilligung (`Grant`) mit passenden Scopes und laufen in v1 serverseitig auf den synchronisierten Daten.

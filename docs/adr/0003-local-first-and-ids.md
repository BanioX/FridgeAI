# ADR-0003: Local-first, clientseitige IDs und Soft-Delete

- **Status:** angenommen
- **Datum:** 2026-11-06

## Kontext

FridgeAI muss ohne Konto und offline funktionieren (US-04, US-12) und später zwischen Geräten eines Haushalts synchronisieren (Schritt 7). Datensätze entstehen deshalb auf dem Gerät, oft ohne Verbindung.

## Entscheid

1. **Local-first:** Die Wahrheit liegt zuerst im Gerät (IndexedDB über Dexie). Der Server ist später ein Synchronisationspartner, keine Voraussetzung.
2. **IDs sind UUIDv7** (RFC 9562), erzeugt auf dem Gerät. Zeit und Zufall werden injiziert (`createIdGenerator(now, randomBytes)`), damit `core` rein und testbar bleibt. Eigene Implementierung (rund 30 Zeilen) statt Dependency.
3. **Jede Zeile trägt** `householdId`, `updatedAt` und optional `deletedAt`. Gelöscht wird nur weich (Soft-Delete), damit der Sync Löschungen weitergeben kann.
4. **Beim ersten Start** entsteht still ein lokaler Haushalt mit einem lokalen Mitglied. Ein späteres Konto übernimmt diese Daten.
5. **Konfliktauflösung** (last-write-wins pro Feld mit Hybrid Logical Clock) wird in einem eigenen ADR zu Schritt 7 festgelegt.

## Konsequenzen

- IDs verraten den ungefähren Erstellungszeitpunkt. Für Haushaltsdaten unkritisch; für öffentliche Links (z. B. Einladungen) verwenden wir eigene, nicht erratbare Codes.
- Abfragen müssen `deletedAt` immer berücksichtigen.

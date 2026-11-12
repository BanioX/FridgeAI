# ADR-0019: Jede Währung möglich, Pilot in Franken

- **Status:** angenommen
- **Datum:** 2026-11-06

## Kontext

Alban (6.11.2026): «Es muss alle Währungen unterstützen können für einen weltweiten Release, aber nur so bauen, dass es umsetzbar ist: Pilot nur CH, dann eventuell DACH usw.» ADR-0004 legt Beträge als Integer-Rappen fest. Andere Währungen haben andere kleinste Einheiten: Euro-Cent (2 Stellen), Yen (0), Kuwait-Dinar (3).

## Entscheid

- **Eine Währung pro Haushalt** (ISO 4217, z. B. `CHF`, `EUR`). Standard ist `CHF`. Innerhalb eines Haushalts wird nicht umgerechnet. Ein Bon in fremder Währung wird mit dem Betrag erfasst, den die Karte belastet hat.
- **Beträge bleiben Ganzzahlen in der kleinsten Einheit der Haushaltswährung.** Bei CHF sind das Rappen. Alles aus ADR-0004 gilt weiter: keine Floats, `allocate` mit Largest Remainder, Property-Tests.
- **Namen:** Felder wie `priceRappen` und `valueRappen` bleiben in Schnittstelle v1 und bedeuten «kleinste Einheit der Haushaltswährung». Ein Umbenennen wäre ein Breaking Change und kommt erst mit Schnittstelle v2, gemeinsam mit anderen Brüchen.
- **Ausgabe:** `formatMoney(amount, currency)` mit der Anzahl Nachkommastellen pro Währung aus einer kleinen Tabelle (deterministisch wie `formatChf`). Für den Pilot reicht `formatChf`. `formatMoney` kommt, sobald ein Haushalt eine andere Währung wählen kann.
- **Einlesen von Bons** ist pro Land eigener Code: CH mit Migros und Coop zuerst, dann DE und AT mit eigenen Parsern hinter demselben Port.
- **Schätzwerte** (Durchschnittspreise pro Kategorie) gelten pro Land. Ausserhalb der Schweiz zeigt die App «geschätzt» nur, wenn es Werte für das Land gibt, sonst keinen Betrag.

## Konsequenzen

- Nichts im Pilot ändert sich sichtbar. Der Weg nach DACH ist ohne Datenmigration offen: neues Feld `currency` am Haushalt, Standard `CHF`.
- Ein Test schützt die Regel: Beträge sind Ganzzahlen, Formatierung nach Währung.
- CLAUDE.md «Geld immer als Integer-Rappen» wird zu «Ganzzahl in der kleinsten Einheit der Haushaltswährung (CHF: Rappen)».

## Stand 7.11.2026: Grundlage gebaut

- `packages/core/src/currency.ts`:
  - `CurrencyCode` (ISO 4217) und `minorDigits` mit Tabelle (JPY 0, KWD 3, sonst 2).
  - `formatMoney` und `parseMoney`. Für CHF sind sie identisch mit `formatChf` und `parseChf`, das prüft ein Test.
  - Euro wird deutsch und österreichisch geschrieben: «1.234,50 €».
  - Unbekannte Währungen bekommen den Code vorne: «USD 1.99».
- **Haushalt:** Er hat das Feld `currency`. Alte Haushalte ohne Feld zählen in CHF (`householdCurrency`), neue werden mit `CHF` angelegt.
- **Oberfläche:** Sie formatiert und liest alle Beträge über `useMoney()` in der Haushaltswährung. Das gilt für Start, Verlauf, Erfassen, Bearbeiten, Bon, Preis-Gedächtnis und PDF-Bericht. Labels zeigen das Symbol («Preis in CHF»).
- **Noch offen, bevor ein Haushalt eine andere Währung wählen kann:**
  - Ein Befehl, um die Währung zu setzen.
  - Schätzwerte gibt es pro Land; ohne Werte für das Land zeigt die App keinen geschätzten Betrag.
  - Bon-Parser für Deutschland und Österreich.
  - Bis dahin bleibt jeder Haushalt in CHF, sichtbar ändert sich nichts.


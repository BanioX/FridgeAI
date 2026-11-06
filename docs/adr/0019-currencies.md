# ADR-0019: Jede Währung möglich, Pilot in Franken

- **Status:** angenommen
- **Datum:** 2026-11-06

## Kontext

Alban (6.11.2026): «Es muss alle Währungen unterstützen können für einen weltweiten Release, aber nur so bauen, dass es umsetzbar ist: Pilot nur CH, dann eventuell DACH usw.» ADR-0004 legt Beträge als Integer-Rappen fest. Andere Währungen haben andere kleinste Einheiten: Euro-Cent (2 Stellen), Yen (0), Kuwait-Dinar (3).

## Entscheid

- **Eine Währung pro Haushalt** (ISO 4217, z. B. `CHF`, `EUR`). Standard ist `CHF`. Innerhalb eines Haushalts wird nicht umgerechnet. Ein Bon in fremder Währung wird mit dem Betrag erfasst, den die Karte belastet hat.
- **Beträge bleiben Ganzzahlen in der kleinsten Einheit der Haushaltswährung.** Bei CHF sind das Rappen. Alles aus ADR-0004 gilt weiter: keine Floats, `allocate` mit Largest Remainder, Property-Tests.
- **Namen:** Felder wie `priceRappen` und `valueRappen` bleiben in Vertrag v1 und bedeuten «kleinste Einheit der Haushaltswährung». Ein Umbenennen wäre ein Breaking Change und kommt erst mit Vertrag v2, gemeinsam mit anderen Brüchen.
- **Ausgabe:** `formatMoney(amount, currency)` mit der Anzahl Nachkommastellen pro Währung aus einer kleinen Tabelle (deterministisch wie `formatChf`). Für den Pilot reicht `formatChf`. `formatMoney` kommt, sobald ein Haushalt eine andere Währung wählen kann.
- **Einlesen von Bons** ist pro Land eigener Code: CH mit Migros und Coop zuerst, dann DE und AT mit eigenen Parsern hinter demselben Port.
- **Schätzwerte** (Durchschnittspreise pro Kategorie) gelten pro Land. Ausserhalb der Schweiz zeigt die App «geschätzt» nur, wenn es Werte für das Land gibt, sonst keinen Betrag.

## Konsequenzen

- Nichts im Pilot ändert sich sichtbar. Der Weg nach DACH ist ohne Datenmigration offen: neues Feld `currency` am Haushalt, Standard `CHF`.
- Ein Test schützt die Regel: Beträge sind Ganzzahlen, Formatierung nach Währung.
- CLAUDE.md «Geld immer als Integer-Rappen» wird zu «Ganzzahl in der kleinsten Einheit der Haushaltswährung (CHF: Rappen)».

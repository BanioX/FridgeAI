# ADR-0004: Geld als Integer-Rappen

- **Status:** angenommen
- **Datum:** 2026-11-06

## Kontext

Kostenteilung (US-10) und CHF-Zähler (US-06) müssen auf den Rappen genau stimmen. Fliesskommazahlen verlieren Genauigkeit (`0.1 + 0.2 !== 0.3`), und bei Aufteilungen auf mehrere Personen entstehen Rest-Rappen.

## Entscheid

- Beträge sind **Integer-Rappen** mit eigenem Typ `Rappen` (Zod-Brand). Rechnen nur mit Ganzzahlen, Prüfung auf sichere Ganzzahlen.
- **Einlesen** mit `parseChf`: akzeptiert die Schreibweisen von Bons und Eingaben (`3.95`, `3,95`, `-.95`, `1'234.50`, `CHF 12.–`, Rabatte mit nachgestelltem Minus `0.80-`), lehnt Mehrdeutiges ab (z. B. drei Nachkommastellen, `1,234.50`).
- **Ausgabe** mit `formatChf`: `CHF 1’234.50`, deterministisch ohne Abhängigkeit von Intl-Daten der Laufzeit.
- **Aufteilen** mit `allocate(total, weights, { offset })` nach dem Largest-Remainder-Verfahren: Die Anteile ergeben immer exakt die Summe, jeder Anteil liegt weniger als einen Rappen vom exakten Wert entfernt. Wer bei Gleichstand den Rest-Rappen bekommt, rotiert über `offset`, damit nicht immer dieselbe Person zahlt. `splitEvenly` ist der Spezialfall mit gleichen Gewichten.
- Property-Tests (fast-check) sichern diese Garantien ab.

## Konsequenzen

- Durchschnittspreise pro Kategorie und Schätzwerte sind ebenfalls Rappen; Schätzungen werden im Modell markiert, nicht als Kommazahl gespeichert.
- Rundung auf 5 Rappen (Bargeld) ist kein Thema der App; angezeigt wird der genaue Betrag.

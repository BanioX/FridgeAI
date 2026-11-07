# ADR-0029: Preisgedächtnis aus den eigenen Bons

- **Status:** angenommen
- **Datum:** 2026-11-07

## Kontext

Alban (7.11.2026): «Preise müssen abgeglichen werden mit Quittung … mit aktuellem Datum. Die Preislogik muss top notch quality sein.» Seit v0.5.0 speichert FridgeAI jede Bonzeile mit Laden, Datum, Menge, Preis und Rabatt (ADR-0028).

## Entscheid

- **Quelle:** nur bezahlte Preise aus den eigenen Bons. Keine Händler-Websites (ADR-0027), keine Schätzungen.
- **Vergleichbar machen:** Preis pro Stück, pro kg oder pro Liter. So vergleicht man 4 × 65 g mit 300 g. Preise in einer anderen Einheit als die letzte zählen nicht mit.
- **Zuletzt bezahlt:** Preis, Laden und Datum der jüngsten Zeile.
- **Üblicher Preis:**
  - Der Median der letzten 120 Tage, nicht der Durchschnitt: Eine einzelne Aktion oder ein Lesefehler verschiebt ihn kaum.
  - Erst ab zwei Preisen.
- **Am günstigsten:** der tiefste Preis pro Einheit der letzten 120 Tage, mit Laden und Datum.
- **«12 % teurer als sonst»:**
  - Ganze Prozent gegenüber dem üblichen Preis.
  - Unter 5 % sagt die App nichts, das wäre Rauschen.
- **Rechnen in Rappen** (ADR-0019). Der Median zweier Werte wird halb aufgerundet.
- **Das Produkt erkennen:** zuerst über den Namen auf dem Bon, gleich geschrieben (`normalizeFoodText`). Derselbe Artikel heisst bei Coop und Migros anders. Ein Abgleich über Barcode oder eine gelernte Zuordnung kommt später (Plan 4d).

## Konsequenzen

- Mit jedem Bon wird das Gedächtnis genauer, ohne Konto und ohne Netz.
- Zuerst zeigt die Prüfliste des Bons «teurer/günstiger als sonst», dann die Erfassung und die Artikelseite.

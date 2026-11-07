# ADR-0023: Nach dem Kochen abbuchen

- **Status:** angenommen
- **Datum:** 2026-11-06

## Kontext

Plan 11c und R-03 wollen, dass der Vorrat nach dem Kochen ohne Tippen stimmt. Die Rezepte (#82 bis #86) nennen Mengen als Text («3 Eier», «2 dl Milch»). Der Vorrat kennt Mengen pro Artikel (10 Eier, 1 l Milch). Eine automatische Umrechnung wäre ungenau und schwer zu durchschauen.

## Entscheid

- **Auswahl pro Lebensmittel statt Umrechnung:** Auf der Rezeptseite öffnet «Zutaten abbuchen» eine Liste der Lebensmittel zu Hause, die das Rezept nutzt.
  - Jedes erscheint nur einmal, auch wenn mehrere Zutaten passen.
  - Wählbar sind «Alles», «Halb» und «Nichts». «Halb» rechnet mit `halfOf` (ADR-0022) und fehlt, wenn es nichts zu teilen gibt.
- **Vorauswahl:**
  - «Alles» für Lebensmittel, die gerettet werden mussten: heute, innert drei Tagen oder nach dem MHD.
  - «Nichts» für frische Lebensmittel, damit ein Rezept mit 3 Eiern nicht eine ganze 10er-Schachtel abbucht.
- **Gezählt als gegessen** über `inventory.recordOutcome`. Die Wirkungs-Karte zählt das mit, und «Rückgängig» nimmt alles mit `inventory.undoOutcome` zurück.
- **Schnittstelle:** `recipes.get` liefert pro Zutat die passenden Artikel mit `itemId`, Menge, Einheit und Datum statt nur Namen. Die Operation war noch in keinem Release, deshalb ist die Änderung kein Bruch von v1.

## Konsequenzen

- Der Vorrat stimmt nach dem Kochen mit zwei bis drei Tipps.
- Genauere Mengen (z. B. «2 von 10 Eiern») bleiben auf der Detailseite möglich und sind eine spätere Idee, falls der Pilot sie verlangt.

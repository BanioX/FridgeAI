# ADR-0050: Wirkung sichtbar: «Seit deinem ersten Monat»

- **Status:** angenommen
- **Datum:** 2026-11-11
- **Entscheid:** Claude (ohne Kosten und ohne neue Datenflüsse)

## Kontext

Rettich soll ehrlich zeigen, ob es hilft. Darum darf die Zahl nicht geschönt sein. Dazu kommt ein kleiner Komfort: die Zahl der Artikel in «Heute retten» am App-Symbol (K2).

## Entscheid

**Vergleich** («Seit deinem ersten Monat entsorgst du 38 % weniger: CHF 12.40 statt CHF 20.10.»), berechnet aus den Ausgängen, nie gespeichert (`compareWasteSinceFirstMonth` in `metrics.ts`, Query `stats.impact`, ADR-0005: Hinzufügen ist erlaubt):

1. **Nur ganze Monate, auf beiden Seiten.** Verglichen wird der letzte abgeschlossene Kalendermonat (Europe/Zurich) mit dem ersten. Kein Vergleich des laufenden Monats.
2. **Der erste Monat** ist der erste volle Kalendermonat ab dem Tag des ersten erfassten Ausgangs (Verwertet oder Entsorgt). Der angebrochene Monat davor zählt nicht, sonst sähe jeder Start gut aus. Rückgängig gemachte Ausgänge zählen nicht.
3. **Nichts anzeigen,** bis es zwei verschiedene abgeschlossene Monate gibt und im ersten etwas entsorgt wurde (sonst Division durch null oder eine erfundene Prozentzahl).
4. **Wert in Rappen** (ADR-0019), Prozent auf ganze Zahlen gerundet, bei halben Werten weg von null, in beide Richtungen gleich. Ein Rückgang auf null ergibt «100 % weniger».
5. **Schlechter wird ebenso schlicht gesagt** («12 % mehr»), ruhig, ohne Moral und ohne Aufmunterung. Gleich bleibt gleich.
6. Der Vergleich geht über den Wert («Entsorgt» in CHF), nicht über die Zahl der Artikel. Schätzwerte (Kategorie statt Bon-Preis) sind darin enthalten; die Zahl nennt keine Kausalität, nur den Vergleich der beiden Monate.

**Zahl am App-Symbol (K2):** `navigator.setAppBadge(n)` mit n = Zahl aller Artikel in «Heute retten» (dieselbe Liste wie auf Start, nicht auf 5 gekürzt), `clearAppBadge()` bei 0. Aktualisiert beim Start und bei jeder Änderung des Vorrats (Live-Query in der App-Hülle). Per Feature-Erkennung, ohne Berechtigung anzufragen; jede Ablehnung wird still verschluckt (iOS braucht die Mitteilungs-Berechtigung, dann geschieht schlicht nichts). Es verlässt nichts das Gerät.

## Folgen

- Eine Familie, die im ersten Monat nichts entsorgt hat, sieht den Vergleich nie. Das ist gewollt: ohne Ausgangswert keine Prozentzahl.
- Nach dem Wechsel der Haushaltswährung oder einem Import (`household.import`) beziehen sich die Beträge auf die gespeicherten Ausgänge, nicht auf umgerechnete.
- Die App-Hülle läuft jetzt auf jeder Seite eine Live-Query auf den Vorrat (`inventory.listExpiring`, schon vorhanden und lokal).

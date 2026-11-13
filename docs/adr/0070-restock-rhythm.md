# ADR-0070: Bald wieder nötig

- **Status:** angenommen
- **Datum:** 2026-11-13
- **Entscheid von:** Claude, auf Albans Wunsch nach mehr sinnvollen Funktionen

## Kontext

«Immer da haben» (ADR-0059) funktioniert nur für Produkte, bei denen jemand einen Mindestbestand gesetzt hat. Dabei weiss Rettich aus den Einkäufen längst, was ein Haushalt regelmässig kauft: Milch alle paar Tage, Brot jede Woche. Wer das nicht von Hand einstellen muss, vergisst weniger.

## Entscheid

Rettich lernt den Kaufrhythmus pro Produkt und schlägt auf «Nachkaufen» vor, was bald wieder nötig ist. Keine Einstellung nötig.

1. **Verlauf:** Alle Artikel eines Produkts zählen als Einkauf, auch aufgebrauchte und entsorgte (`purchasedAt`). Gelöschte Artikel zählen nicht, sie sind meist rückgängig gemachte Einträge. Mehrere Packungen am selben Kalendertag (Europe/Zurich) sind ein Einkaufstag.
2. **Rhythmus:** mindestens 3 Einkaufstage. Der Rhythmus ist der Median der Abstände zwischen aufeinanderfolgenden Einkaufstagen, auf ganze Tage gerundet. Rhythmen unter 2 oder über 60 Tagen ergeben keinen Vorschlag.
3. **Fällig:** ab dem Tag vor `letzter Einkaufstag + Rhythmus`.
4. **Vorgeschlagen wird nur, wenn:** keine offene Packung des Produkts da ist (nicht aufgebraucht, nicht gelöscht), kein Eintrag auf der Einkaufsliste steht, offen oder abgehakt (gleicher normalisierter Name oder gleiches Produkt; abgehakt heisst: schon im Korb) und für das Produkt kein Mindestbestand gesetzt ist (den bedient «Immer da haben»).
5. **Reihenfolge:** am meisten überfällig zuerst, höchstens 5.
6. **Schnittstelle:** neue Abfrage `shopping.suggestions` (Name, Rhythmus in Tagen, letzter Einkauf je Vorschlag). Die reine Regel liegt in `packages/core/src/shopping/restock-rhythm.ts`.
7. **Anzeige:** Auf «Nachkaufen» eine ruhige Karte «Bald wieder nötig» über der Liste. Jede Zeile zeigt den Namen, «etwa alle 5 Tage · zuletzt am 8.11.» und «Auf die Liste» (setzt den Eintrag mit `shopping.addItem`). Ohne Vorschläge ist die Karte nicht da.

## Folgen

- Es wirkt erst mit Verlauf: ein neuer Haushalt sieht nichts, bis ein Produkt dreimal an verschiedenen Tagen gekauft wurde.
- Alles rechnet auf dem Gerät aus den Haushaltsdaten; es verlässt nichts das Gerät und es wird nichts Neues gespeichert.
- Unregelmässig gekaufte Produkte können zur falschen Zeit auftauchen. Der Median dämpft Ausreisser; wer es nicht braucht, ignoriert die Karte. Ein Wegwischen der Vorschläge gibt es noch nicht.

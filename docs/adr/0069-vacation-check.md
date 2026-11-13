# ADR-0069: Ferien-Check

- **Status:** angenommen
- **Datum:** 2026-11-13
- **Entscheid von:** Claude, auf Albans Wunsch nach mehr sinnvollen Funktionen

## Kontext

Vor den Ferien liegt der Kühlschrank voll, und niemand weiss genau, was bis zur Rückkehr verdirbt. Die App kennt alle Daten, zeigt sie aber nur nach dem heutigen Tag. Wer wegfährt, will wissen: Was läuft ab, solange ich weg bin, und was kann ich noch retten?

## Entscheid

1. **Eine Seite unter «Mehr» → «Ferien-Check»** (`/more/vacation`). Zwei Datumsfelder, «Weg ab» (Vorgabe: morgen) und «Zurück am» (Vorgabe: sieben Tage danach), mit dem bestehenden Datumsfeld. Liegt «Zurück am» vor «Weg ab», steht ein Hinweis statt der Liste.
2. **Was zählt:** Artikel im Kühlschrank und im Vorrat, deren Datum auf den Rückkehrtag oder früher fällt (der Rückkehrtag zählt mit). Bereits Abgelaufenes zählt auch, es braucht jetzt Aufmerksamkeit. Tiefkühler und Notvorrat bleiben aussen vor, sie halten Wochen und Monate. Die Auswahl ist eine reine Funktion (`vacation-plan.ts`) und rechnet auf dem Gerät.
3. **Zwei Gruppen:** «Einfrieren» für Artikel, deren Kategorie eine Haltbarkeit im Tiefkühler hat, und «Vorher aufbrauchen» für den Rest. Innerhalb jeder Gruppe steht oben, was zuerst abläuft.
4. **Einfrieren mit einem Tipp:** pro Artikel und «Alle einfrieren» für die Gruppe. Die Seite nutzt dieselbe Mechanik wie die Auswahlleiste im Vorrat (`useMoveSelected`): derselbe Hinweis vor Lebensmitteln, die schlecht gefrieren, derselbe Befehl `inventory.move` nach `freezer`, dieselbe Meldung danach («… in den Tiefkühler gelegt»). Der Artikel verschwindet dank der Live-Abfrage aus der Liste. Ein eigenes «Rückgängig» gibt es nicht; der Artikel lässt sich auf der Artikelseite wieder auftauen.
5. **Nichts verlässt das Gerät,** und es werden keine Daten gespeichert: Die beiden Daten leben nur, solange die Seite offen ist.

## Folgen

- Die Gruppe «Einfrieren» richtet sich nur nach der Kategorie. Ein Artikel mit falscher Kategorie landet in der falschen Gruppe; der Hinweis vor dem Einfrieren fängt das Gröbste ab.
- Verpackte Ware mit weit entferntem Datum erscheint nicht, auch wenn sie nach dem Öffnen früher verdirbt; geöffnete Artikel tragen schon ein kürzeres Datum.
- Neue Fläche: Die Seite bekommt keinen Eintrag in Start, Bilanz oder PDF; sie ist ein Werkzeug vor der Reise, keine Dauer-Anzeige.

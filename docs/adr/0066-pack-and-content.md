# ADR-0066: Packung und Inhalt

- **Status:** angenommen
- **Datum:** 2026-11-12
- **Entscheid von:** Claude, auf Albans Rückmeldung

## Kontext

Alban: «Es braucht eine Unterscheidung zwischen Packung und Inhalt. Aktuell nimmt der Wisch −1 Stk., wo wirklich die Packung gemeint ist statt die einzelne Scheibe Schmelzkäse.» Bisher zählte ein Artikel nur Stück. Bei Joghurt ist ein Stück ein Becher, also eine Packung; bei Schmelzkäse ist ein Stück eine Scheibe.

## Entscheid

1. **Der Artikel kennt den Inhalt einer Packung:** `piecesPerPack` (2 bis 200), nur bei Stück. Ohne das Feld ist jedes Stück eine eigene Packung (Joghurtbecher, Glace), alles bleibt wie bisher.
2. **Beim Erfassen:** Kategorien mit Packungsgrössen (Eier 6er und 10er, Käsescheiben 10er, 8er und 12er) schlagen die erste Grösse vor, statt «1 Stück». Passt die Menge zu einer Packungsgrösse oder einem Vielfachen davon, wird sie gespeichert: 10 Scheiben sind 1 Packung à 10, 20 sind 2 Packungen à 10, 16 sind 2 à 8 (`piecesPerPackFor`). Gespeichert, nicht geraten (L-31).
3. **Wisch in der Liste = Packung:** Ein Wisch nimmt eine ganze Packung, bei einer angebrochenen Packung deren Rest (`packContent`, `packTake`). Der Streifen sagt «1 Packung» oder «Rest der Packung», der Hinweis «Schmelzkäse: 1 Packung verwertet».
4. **Ring auf der Artikelseite = Inhalt:** Antippen nimmt ein Stück (eine Scheibe, ein Ei), Halten öffnet das Menü (ADR-0063).
5. **Die Liste zeigt Packungen:** «1 Packung à 10 Stk.», «2 Packungen à 10 Stk.», «7 von 10 Stk.» für die angebrochene, «1 Packung à 10 + 7 Stk.» für beides.
6. **Schnittstelle (additiv):** `piecesPerPack` bei `inventory.addItem` und an `InventoryItemView`.

## Folgen

- Ältere Artikel haben das Feld nicht und verhalten sich wie bisher (ein Wisch nimmt ein Stück). Ändern lässt es sich noch nicht; wer es braucht, erfasst die Packung neu.
- Quittungen und Barcodes setzen das Feld noch nicht; das kommt, wenn die Packungsgrösse aus dem Produkt bekannt ist.

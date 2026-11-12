# ADR-0066: Packung und Inhalt

- **Status:** angenommen
- **Datum:** 2026-11-12
- **Entscheid von:** Claude, auf Albans Rückmeldung

## Kontext

Alban: «Es braucht eine Unterscheidung zwischen Packung und Inhalt. Aktuell nimmt der Wisch −1 Stk., wo wirklich die Packung gemeint ist statt die einzelne Scheibe Schmelzkäse.» Bisher zählte ein Artikel nur Stück. Bei Joghurt oder Eiern steht ein Stück für sich (ein Becher, ein Ei); bei Schmelzkäse ist ein Stück eine Scheibe, und gemeint ist die Packung.

## Entscheid

1. **Der Artikel kennt den Inhalt einer Packung:** `piecesPerPack` (2 bis 200), nur bei Stück. Ohne das Feld steht jedes Stück für sich (Joghurtbecher, Ei, Glace), alles bleibt wie bisher.
2. **Die Kategorie sagt, ob als Packung gezählt wird:** `sharedPack` an der Portionierung, heute nur bei Käsescheiben (10er, 8er, 12er). Die Stücke sind dort Teile eines Produkts in einer Hülle. Eier und Joghurt haben auch Packungsgrössen (6er, 10er, 4er), aber jedes Stück wird einzeln genommen: Ein Wisch nimmt dort weiter ein Stück.
3. **Beim Erfassen:** Eine Kategorie mit `sharedPack` schlägt ihre erste Packungsgrösse vor, statt «1 Stück». Passt die Menge zu einer Packungsgrösse oder einem Vielfachen davon, wird sie gespeichert: 10 Scheiben sind 1 Packung à 10, 20 sind 2 Packungen à 10, 16 sind 2 à 8 (`piecesPerPackFor`). Gespeichert, nicht geraten (L-31).
4. **Wisch in der Liste = Packung:** Ein Wisch nimmt eine ganze Packung, bei einer angebrochenen Packung deren Rest (`packContent`, `packTake`). Der Streifen sagt «1 Packung» oder «Rest der Packung», der Hinweis «Schmelzkäse: 1 Packung verwertet».
5. **Ring auf der Artikelseite = Inhalt:** Antippen nimmt eine Scheibe, Halten öffnet das Menü (ADR-0063). Bei mehreren Packungen zeigt der Ring die angebrochene, «7 von 10 übrig», darunter «Dazu 1 ganze Packung» (`currentPack`).
6. **Liste und Artikelseite zeigen Packungen:** in der Zeile kurz, damit neben dem Datum nichts abgeschnitten wird («1 × 10 Stk.», «2 × 10 Stk.», «1 × 10 + 7 Stk.»), auf der Artikelseite ausgeschrieben («1 Packung à 10 Stk.», «1 Packung à 10 + 7 Stk.»). Die angebrochene Packung heisst überall «7 von 10 Stk.».
7. **Schnittstelle (additiv):** `piecesPerPack` bei `inventory.addItem` und an `InventoryItemView`.

## Folgen

- Ältere Artikel haben das Feld nicht und verhalten sich wie bisher (ein Wisch nimmt ein Stück). Ändern lässt es sich noch nicht; wer es braucht, erfasst die Packung neu.
- Quittungen und Barcodes setzen das Feld noch nicht; das kommt, wenn die Packungsgrösse aus dem Produkt bekannt ist.

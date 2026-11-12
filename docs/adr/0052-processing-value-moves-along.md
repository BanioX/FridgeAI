# ADR-0052: Verarbeiten: der Wert wandert mit

- **Status:** angenommen
- **Datum:** 2026-11-11
- **Entscheid von:** Alban (Idee), Claude (Umsetzung)

## Kontext

Alban (11.11.2026): «Mehl zu Brot verarbeitet … einen Kuchen backen und Eier verwerten … ein Rezept kochen und Reste landen im Kühlschrank, solch eine Kombinations-Logik.» Bis jetzt kann Rettich nur Artikel abschliessen (verwertet, entsorgt). Wer backt oder kocht, hat danach etwas Neues im Kühlschrank, und die Bilanz darf es nicht doppelt zählen: Wird ein Kuchen später entsorgt, wären Mehl und Eier einmal als verwertet und der Kuchen noch einmal als entsorgt verbucht.

## Entscheid

1. **Neuer Befehl `inventory.process`** (Berechtigung `inventory:write`, Anwendungsfall in `application/inventory-process.ts`, ADR-0034). Eingabe:
   - `ingredients`: Liste aus `itemId` und optionaler `quantity` (ganz oder teilweise, dieselbe Portionslogik wie `inventory.recordOutcome`; die Liste darf für «Reste erfassen» leer sein);
   - optional `result`: Name, Art (`made` selbst gemacht, `leftover` Reste), Lagerort (Standard Kühlschrank) und optional eine Kategorie;
   - optional `recipeId`, wenn es von einem Rezept aus gestartet wurde («Gekocht»).
   Ohne Ergebnis und ohne Zutaten gibt es nichts zu tun (abgelehnt), jede Zutat darf nur einmal vorkommen.
2. **Zutaten** bekommen den Ausgang «verwertet» (`eaten`). Gibt es ein Ergebnis, trägt der Ausgang das neue Feld `madeInto` mit der Id des neuen Artikels. Die Portionslogik steht an einer Stelle (`application/outcome-writer.ts`) und dient `inventory.recordOutcome` und `inventory.process`; die Zutaten lösen dieselben Ereignisse `item.consumed` und `item.used_up` aus wie sonst.
3. **Das Ergebnis** ist ein neuer Artikel mit den neuen Feldern `origin` (`made` oder `leftover`) und `madeFrom` (Ids der Zutaten). Sein Wert ist die Summe der Zutatenwerte in Rappen; war einer davon geschätzt, ist die Summe `priceEstimated` (neues Feld, die Anzeige sagt «etwa»). Ohne Zutaten hat der Artikel keinen eigenen Wert. Das Datum kommt aus der Kategorie.
4. **Zwei neue Kategorien:**
   - «Gebäck selbst gemacht» (`bakery-homemade`): Mindesthaltbarkeit, Kühlschrank 3, Tiefkühler 90, Vorrat 2 Tage;
   - «Reste & Gekochtes» (`prepared-leftovers`): Verbrauchsdatum, Kühlschrank 3, Tiefkühler 90 Tage.
   Beide haben keinen Schätzpreis (0), damit aus Nichts kein Wert entsteht. Ohne Kategorie nimmt `made` die erste, `leftover` die zweite. Wer den Namen tippt, trifft sie auch ohne die Art: «… selbst gemacht», «selbstgebacken», «Torte», «Muffin» und alles, was mit «Reste» beginnt («Reste: Lasagne»). «Kuchen» und «Zopf» allein bleiben, was sie auf der Quittung sind (Gebäck und Brot vom Laden).
5. **Ehrliche Zahlen, der Wert wandert mit:** Ausgänge mit `madeInto` zählen in keiner Wertsumme: Bilanz, «Seit deinem ersten Monat», Auszüge, Gerettet. Die Regel steht an einer Stelle, `countsInValue` in `metrics.ts`; `summarizeImpact` (und damit `stats.waste`, `stats.impact`, der Bericht) und die Monatssummen des Berichts nutzen sie. Das Ergebnis zählt normal, sobald es verwertet oder entsorgt wird. Ohne Ergebnis («Gekocht, nichts übrig») gibt es kein `madeInto`, die Zutaten zählen normal als verwertet. Rückgängig macht die Zutaten wieder zu Vorrat (`inventory.undoOutcome`), das Ergebnis löscht `inventory.deleteItem`; die Oberfläche macht beides mit einem Tipp auf «Rückgängig».
6. **Gerettet:** Eine verarbeitete Zutat, die bald ablief, zählt nicht als gerettet (sie bekommt nie das Merkmal `rescued`). Das ist eine bekannte Vereinfachung (TD-20).
7. **Ereignis `item.processed`** mit `ingredientIds`, `resultId` (oder keiner), `recipeId` (oder keiner) und `kind`: `made`, `leftover` oder `cooked` (kein Ergebnis). Die Abzeichen (Am Herd, Backstube, Resteküche; [`docs/abzeichen.md`](../abzeichen.md)) zählen später diese Ereignisse; was nach «Rückgängig» zählt, entscheidet dann die Abzeichen-Berechnung anhand der gelöschten Zeilen.
8. **Oberfläche:** Die Seite «Verarbeiten» (`/add/process`) hat drei Einstiege: «Verarbeiten» auf der Artikelseite (wählt den Artikel vor), die Kachel «Reste erfassen» auf «Erfassen» (nur ein Name, 3 Tage) und «Gekocht» auf der Rezeptseite (wählt die «Da»-Zutaten vor, fragt «Reste in den Kühlschrank?», gibt `recipeId` mit). Danach steht im Vorrat «Kuchen ist im Kühlschrank. 3 Zutaten verwertet.» mit «Rückgängig». Auf der Artikelseite eines selbst gemachten Artikels steht ruhig «Selbst gemacht aus: Mehl, Eier, Butter» oder «Reste». Abzeichen sind hier nicht gebaut.

## Folgen

- **Schnittstelle v1:** 41 statt 40 Operationen, 24 statt 23 Ereignisarten (Hinzufügen ist erlaubt, ADR-0005).
- **Datenrechte (ADR-0020):** Die neuen Felder (`origin`, `madeFrom`, `priceEstimated` am Artikel, `madeInto` am Ausgang) sind optional. Alte Exportdateien bleiben gültig; Export, Import und Löschen nehmen die Felder ohne weiteren Code mit (Tests).
- **Kein neuer Datenfluss:** alles auf dem Gerät.
- **Verworfen:** Zutaten als «entsorgt» zu buchen, wenn der Kuchen entsorgt wird (würde alte Einträge nachträglich ändern), und ein eigener Ausgang «verarbeitet» (bräche alle Stellen, die nur `eaten`, `shared_out` und `wasted` kennen).

## Nachtrag: das Journal folgt der Zählregel

Das Journal (`inventory.history`) zählte verarbeitete Zutaten mit vollem Wert als «Verwertet», sein Total wich von der Bilanz ab. Jetzt trägt jeder Eintrag `countsInValue` (aus `countsInValue` in `metrics.ts`, die Regel steht weiter an einer Stelle) und bei verarbeiteten Zutaten `madeInto` (`itemId`, Name des Ergebnisses). Die Zeile zeigt «→ Bananenkuchen» statt eines Werts, das Total zählt nur Einträge mit `countsInValue` und stimmt damit mit der Bilanz überein. Ausgabe-Erweiterung, keine neue Operation.

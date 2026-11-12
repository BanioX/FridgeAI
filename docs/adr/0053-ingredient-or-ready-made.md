# ADR-0053: Zutat oder Fertigprodukt

- **Status:** angenommen
- **Datum:** 2026-11-11
- **Entscheid:** Alban (Runde 2), Claude (Umsetzung)

## Kontext

Alban: «Bei Rezepten muss erkannt werden, dass er Skyr Cheesecake nicht als Joghurt für Müesli empfiehlt, weil es ja Convenience-Essen ist. Solch eine Trennung und Regel braucht es, auch ein Badge … damit man das nicht in Rezepte einbauen kann, nur Rohes. Ausser du machst Oreo Cheesecake.»

Bis dahin ordnete der Matcher «Skyr Cheesecake» der Kategorie Joghurt zu und «Sandwich Schinken» dem Aufschnitt; Tiramisu, Pudding und Oreo fanden keine Kategorie. Die Rezepte zählten das als Zutat.

## Entscheid

- **Rolle je Kategorie:** Der Katalog bekommt das optionale Feld `ready: true` für Kategorien, die immer essfertig sind: Fertiggerichte & Salate, Tiefkühl-Pizza & Fertiges, Süsses & Snacks, Glace und die neue Kategorie «Desserts». Alles andere ist eine Zutat.
- **Neue Kategorie «Desserts»** (`prepared-desserts`, Gruppe Fertiges, Kühlschrank): Cheesecake, Tiramisu, Pudding, Mousse, Panna Cotta, Crème brûlée, Torte, Dessert, Köpfli, Flan. Haltbarkeit wie bei Joghurt (14 Tage) und Dips (10 Tage), aber vorsichtiger, weil Rahm- und Frischkäsedesserts schneller kippen: 7 Tage im Kühlschrank, 60 im Tiefkühler (wie Joghurt und Rahm), nach dem Öffnen 2 Tage, «mindestens haltbar bis». Die Werte sind Schätzungen im Sinn von ADR-0038, das aufgedruckte Datum gilt immer.
- **Namen-Wörter von Fertigprodukten schlagen die von Zutaten:** Im Matcher bekommt ein starkes Stichwort einer `ready`-Kategorie einen Zuschlag. So wird «Skyr Cheesecake» zum Dessert und «Sandwich Schinken» zum Fertiggericht, «Emmi Skyr Nature» bleibt Joghurt und «Schinken» Aufschnitt. «Lasagne» wanderte aus «Tiefkühl-Pizza & Fertiges» zu den Fertiggerichten (frisch im Kühlschrank ist häufiger; «TK Lasagne» bleibt tiefgekühlt). Neue Wörter (Oreo, Kekse, Köpfli, Flan) stehen bei den Quittungswörtern, damit die Stichwortlisten kurz bleiben.
- **Pro Artikel:** `readyMade?: boolean` am Artikel überschreibt die Kategorie («Zum Kochen» oder «Fertigprodukt»); fehlt es, entscheidet die Kategorie. Alte Daten laden weiter. `isReadyMade(item)` in `packages/core` ist die eine Stelle dafür. Die Artikelseite bietet den Schalter «Art des Artikels» unter «Weitere Aktionen» über `inventory.updateItem`; wer zur Kategorie zurückschaltet, speichert nichts (`null`), der Artikel folgt dann künftigen Katalogänderungen.
- **Aus dem Barcode:** Open Food Facts liefert NOVA-Gruppe 4 oder eine Kategorie wie Desserts oder Fertiggerichte: dann setzt die Erfassung `readyMade`. Dafür kommt das Feld `nova_group` in dieselbe Abfrage (kein neuer Aufruf, nichts Neues verlässt das Gerät). Die Auswertung steht in `parseOffProduct`, die Abfrage von `products.lookup` reicht den Hinweis an das Formular.
- **Badge «Fertigprodukt»:** neue Art `ready` in `itemBadges`, ruhig neutral (Silber, kein Warnzeichen), nach Eingefroren und Aufgetaut, vor Geöffnet.
- **Rezept-Regel:** Eine Zutat zählt nur Artikel, die keine Fertigprodukte sind (`matchesIngredient` in `packages/core/src/recipes/recipe.ts`). Ausnahme: Gehört die Zutat selbst zu einer `ready`-Kategorie (eigenes Rezept «Oreo Cheesecake» mit «Oreo» in Süsses & Snacks), zählen Fertigprodukte. Die Regel gilt für «Da» und «Fehlt», die Vorschläge und «Alle Rezepte».

## Folgen

- Flavoured Skyr oder Joghurt, den Open Food Facts mit NOVA 4 führt, gilt als Fertigprodukt und zählt in Rezepten nicht. Der Schalter auf der Artikelseite korrigiert das; die Schwelle bleibt bewusst so, wie Alban sie wollte.
- Eigene Rezepte mit einer Zutat, die der Matcher nicht erkennt, behalten nur Wort-Treffer; auch diese schliessen Fertigprodukte aus.
- Kein neuer Datenfluss, keine Abhängigkeit.

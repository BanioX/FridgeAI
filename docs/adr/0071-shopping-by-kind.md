# ADR-0071: Nachkaufen nach Art

- **Status:** angenommen
- **Datum:** 2026-11-13
- **Entscheid von:** Claude, auf Albans Wunsch nach mehr sinnvollen Funktionen

## Kontext

Im Vorrat gibt es seit ADR-0067 die Ansicht «Nach Art». Die Liste «Nachkaufen» zeigte ihre offenen Einträge dagegen in der Reihenfolge, in der sie dazukamen. Im Laden läuft man aber Regal für Regal: Wer Milch, Äpfel und Rüebli aufgeschrieben hat, springt hin und her.

## Entscheid

1. **Offene Einträge in Blöcken nach Art**, mit denselben Arten, Bildern und Namen wie im Vorrat (`item-kinds.ts`, `KindSection`). Nichts ist kopiert. Erledigte Einträge («Im Korb») bleiben wie bisher in einer eigenen Liste.
2. **Art eines Eintrags:** Trägt er eine Kategorie, gilt sie. Sonst schätzt `matchCategoryByName` die Kategorie aus dem Namen; ohne Treffer steht der Eintrag unter «Anderes». Die Zuordnung ist eine reine Funktion (`shopping-kinds.ts`) und speichert nichts.
3. **Reihenfolge wie ein Gang durch den Laden**, nicht nach dem, was zuerst verdirbt: Früchte, Gemüse, Brot und Gebäck, Milchprodukte, Fleisch, Fisch, Reste, Fertiges, Süsses, Getränke, Getreide, Konserven, Öl und Gewürze, Notration, Haushalt, Anderes. Im Vorrat zählt, was man zuerst braucht (Fisch und Fleisch vorn); im Laden zählt der Weg: Früchte und Gemüse am Eingang, dann die Bäckerei, die Kühlregale, die Gestelle, zuletzt Haushalt. `groupByKind` nimmt dafür eine optionale Reihenfolge; ohne sie bleibt alles wie in ADR-0067.
4. **Ab zwei Arten Blöcke:** Bei nur einer Art bleibt die schlichte Liste, eine einzelne Überschrift brächte nichts.
5. **Nichts ändert sich am Verhalten der Zeilen:** Abhaken, Entfernen, «Du hast noch …», Mengen-Tipps und Teilen sind wie zuvor.

## Folgen

- Ein Eintrag mit unbekanntem Namen steht unter «Anderes», bis er eine Kategorie hat.
- Die Schätzung aus dem Namen kann danebenliegen (wie bei Artikeln im Vorrat); sie ist nur eine Anzeige.
- Die Läden sind verschieden gebaut; die feste Reihenfolge ist ein Mittelweg, keine Ladenkarte.

# ADR-0080: Eigene feine Symbole statt Emojis

- **Status:** angenommen
- **Datum:** 2026-11-13
- **Entscheid von:** Alban («Eigene feine Symbole, keine Emojis», 13.11.2026)

## Kontext

Lebensmittel trugen ein Emoji pro Kategorie. Emojis sehen auf jedem Gerät anders aus, sind bunt und verspielt und standen neben den feinen Liniensymbolen der App (Lucide). Das war der grösste Bruch im Stil.

## Entscheid

1. **Ein Symbol pro Kategorie** (`apps/web/src/ui/food-icon-nodes.ts`, `CATEGORY_ICONS`): Lucide (ISC), wo es ein passendes gibt, sonst eine eigene Zeichnung im selben 24-px-Raster, mit runden Enden und demselben Strich: Käse, Butter, Joghurt, Wurst, Gurke, Tomate, Kartoffel, Zwiebel, Pilz, Brot, Pasta, Schale für Reis und Müesli, Glas, Flasche, Salzstreuer, Papierrolle. Jede Kategorie des Katalogs hat ein Symbol (Test); eine unbekannte bekommt den Korb.
2. **Ein Rahmen für alle:** `FoodIcon` zeigt das Symbol in Onyx auf einer silbernen Kachel (klein im Text, mittel in Zeilen, gross im Kopf einer Seite). Ein Packungsbild ersetzt das Symbol wie bisher.
3. **Überall in der App:** Vorrat, Start, Artikelseite, Ändern, Nach Art (Kacheln und Blöcke), Nachkaufen, Schnell erfassen, Mehrere auf einmal, Kühlschrank-Check, Haltbarkeit A–Z, Wo ist was?, Klimabilanz.
4. Der Katalog im Kern behält sein Feld `emoji` für Daten und Export; die Oberfläche zeigt es nicht mehr.

## Folgen

- Listen wirken ruhig und auf jedem Gerät gleich.
- Die PDF-Auszüge zeigen dieselben Symbole: Das Gerät zeichnet jedes einmal auf seiner silbernen Kachel als undurchsichtiges JPEG (`pdf-assets.ts`), ohne Transparenz und damit ohne graue Kästen in manchen Betrachtern.

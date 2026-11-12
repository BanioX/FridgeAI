# ADR-0067: Vorrat nach Art

- **Status:** angenommen
- **Datum:** 2026-11-12
- **Entscheid von:** Claude, auf Albans Wunsch

## Kontext

Alban, mit einem Bild des Kühlschranks mit 28 Artikeln: «Ich hätte hier gerne noch eine Sortier-Option, welche Sinn macht, nach Kategorie wie Fisch, Fleisch, Gemüse. Am besten in Kacheln oder abgetrennt in Vierecken.» Die Liste zeigte bisher nur, was zuerst abläuft. Bei vielen Artikeln findet man so schlecht, was man von einer Art hat.

## Entscheid

1. **Zwei Ansichten im Vorrat:** «Nach Ablauf» (wie bisher) und «Nach Art». Ein ruhiger zweiter Umschalter unter den Lagerort-Tabs, nicht in Smaragd, damit die Tabs die erste Wahl bleiben.
2. **Die Wahl merkt sich das Gerät** (`localStorage`), wie der Wisch-Tipp. Sie ist eine Anzeige, keine Haushaltsdaten, und gehört nicht in den Export.
3. **Arten statt Katalog-Gruppen:** Die Arten folgen den Gruppen des Katalogs, mit wenigen Kategorien dort, wo man sie sucht: Früchte getrennt von Gemüse, Süsses zusammen (Schokolade, Desserts, Glace), Saucen bei den Konserven, Kaffee, Tee und Wasser bei den Getränken. Reste aus «Verarbeiten» stehen unter «Reste», egal welche Kategorie sie tragen. Die Zuordnung liegt in der Web-App (`item-kinds.ts`), der Katalog bleibt unverändert.
4. **Reihenfolge nach dem, was zuerst verdirbt:** Fisch, Fleisch, Reste, Milchprodukte, Gemüse, Früchte, Brot, Fertiges, Süsses, Getränke, Getreide, Konserven, Öl und Gewürze, Notration, Haushalt, Anderes. Die Reihenfolge ist fest, damit man eine Art immer am selben Ort findet. In jeder Art bleibt das Früheste oben.
5. **Kacheln und Blöcke:** Oben eine Kachel pro Art mit Bild, Anzahl und dem, was fällig ist («1 jetzt» bei heute oder abgelaufen, sonst «2 bald»). Ein Tipp auf die Kachel springt zum Block. Darunter jede Art als eigenes Viereck mit Überschrift und Anzahl; Wischen, Auswählen und Ziehen funktionieren wie in der Liste. Beim Auswählen verschwinden Umschalter und Kacheln, die Blöcke bleiben.

## Folgen

- Ein Artikel mit falscher Kategorie steht in der falschen Art (zum Beispiel Glace unter Früchten, wenn der Name «Himbeer» die Kategorie bestimmt hat). Das sieht man in der Ansicht nach Art schneller als vorher; korrigieren lässt es sich auf der Artikelseite.
- Neue Kategorien bekommen ihre Art über die Gruppe; ein Test prüft, dass nur «Anderes» ohne Art bleibt.

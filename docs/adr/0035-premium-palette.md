# ADR-0035: Premium-Palette – Smaragd, Silber, Onyx

- **Status:** angenommen
- **Datum:** 2026-11-07
- **Ersetzt:** die fünf Gartengrüns (PR #132) als Markenfarben

## Kontext

Am 7.11.2026 bekam rettich fünf Grüntöne aus dem Garten (Broccoli, Rucola, Basilikum, Kopfsalat, Eisberg). Am selben Abend dann Alban: «Das aktuelle Grün finde ich nicht mehr schön. Ich brauche ein Premium-Grün und Premium-Silber oder Premium-Schwarz, diese drei Töne.»

## Entscheid

Drei Töne tragen die Marke:

- **Smaragd** `#135E42`: Knöpfe, gewähltes Segment, aktiver Tab. Ein tiefes, leicht bläuliches Grün. Die Stufen 50 bis 950 sind in OKLCH gerechnet (Farbton 163°).
- **Silber:** kühle Neutraltöne für Grund (`#F3F4F6`), Flächen (`#E9EBED`) und Linien (`#DBDEE2`), dazu `#BABEC4` für Schrift auf Onyx.
- **Onyx** `#0D1012` und Schrift `#14161A`: Text, der ＋-Knopf und eine dunkle Karte pro Seite (der Wert im Kühlschrank auf Start).

Die Tailwind-Namen `basil-*`, `oat`, `ink` bleiben, damit der Wechsel nur die Werte betrifft. Status- und Lagerort-Farben (bald, heute, Eis, Weizen, Oliv) bleiben, sie tragen Bedeutung. Alle Text-Paare erfüllen WCAG AA: Weiss auf Smaragd 7.8:1, Nebentext auf Silber 5.7:1, Silber auf Onyx 10.2:1.

**Nachtrag 7.11.2026:** Alban hat Variante A gewählt: Das Logo behält seine Form und bekommt einen Grund in Smaragd. Auf iPhones bleibt das alte Symbol, bis die App neu zum Home-Bildschirm hinzugefügt wird (vorher exportieren, danach importieren).

## Konsequenzen

- Ein Ton weniger Natur, dafür eine ruhigere, hochwertigere Wirkung. Naturtöne bleiben als Akzente möglich, nie als zweite Markenfarbe.
- Ein Dunkelmodus kann später auf Onyx und Silber aufbauen.

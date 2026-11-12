# ADR-0026: Kategorie nur im Hintergrund

- **Status:** angenommen
- **Datum:** 2026-11-07

## Kontext

Alban (6.11.2026): «Ich will keine automatischen Kategorien.» Beim Tippen des Namens sprang das Feld «Kategorie» mit Emoji jedesmal mit. Das wirkte, als würde die App das Produkt einordnen statt es zu erkennen.

Die Kategorie wird trotzdem gebraucht: Sie schlägt Lagerort, Menge, Verpackung und Ablaufdatum vor (Schritt 3d). Ohne sie wäre jedes Datum geschätzt wie «Sonstiges».

Auf Nachfrage wählte Alban: «Feld ausblenden». Die App nutzt die Kategorie still im Hintergrund, ändern lässt sie sich unter «Mehr Angaben».

## Entscheid

- Das Feld «Kategorie» im Formular «Artikel erfassen» liegt zugeklappt unter **«Mehr Angaben»** (`<details>`), unten vor «Speichern», ohne Emoji. Ein Hinweis sagt, wozu sie dient.
- Die App rät die Kategorie weiter aus dem Namen, aus dem Barcode oder aus dem gewählten Treffer der Suche.
- Die Trefferliste der Suche zeigt keine Kategorie-Emojis mehr (ADR-0025).
- Auf der Bearbeiten-Seite eines Artikels bleibt die Kategorie sichtbar: Dort korrigierst du gezielt.

## Konsequenzen

- Das Formular ist kürzer. Beim Tippen bewegt sich nichts mehr ausser den Treffern.
- Rät die App falsch, merkt man es erst am vorgeschlagenen Ort oder Datum. Das Datum bleibt immer sichtbar und änderbar.

# ADR-0068: Foto aufnehmen liest das Etikett

- **Status:** angenommen
- **Datum:** 2026-11-12
- **Entscheid von:** Claude, auf Albans Wunsch

## Kontext

Alban, nach «Quittung fotografieren» auf Start (#290): «Ich meine nicht nur Quittung fotografieren, sondern Essen fotografieren oder Produkt etc. Dass er die Etikette ausliest.» Rettich las bisher aus Fotos die Quittung, das Datum auf der Packung (ADR-0062), den Barcode und die Nährwerttabelle, jedes an seiner eigenen Stelle. Aus einem Foto der Packung ein ganzer Artikel wurde nicht.

## Entscheid

1. **Ein Knopf «Foto aufnehmen»** auf Start und unter «Erfassen». Rettich erkennt selbst, ob das Foto eine Quittung oder eine Packung zeigt: Findet der Quittungsleser mindestens zwei Artikel mit Preis, geht es zur Quittung, sonst zum Etikett.
2. **Was vom Etikett gelesen wird** (`readLabel`, reine Textlogik im Kern):
   - das Datum mit demselben Leser wie «Datum fotografieren», irgendwo auf dem Foto;
   - die Menge von der Vorderseite («500 g», «1 l», «6 Stück»), nie die Portionsgrösse («pro 100 g»);
   - die Wörter der Vorderseite für die Suche im mitgelieferten Katalog. Was nach «Zutaten» oder «Nährwerte» steht, zählt nicht: Sonst würde Schokolade wegen «Vollmilchpulver» zur Milch;
   - eine Kategorie aus denselben Wörtern.
3. **Vorschläge statt Raten:** Katalog-Treffer zählen nur, wenn mindestens zwei Wörter des Produkts und mehr als die Hälfte seiner Wörter auf dem Etikett stehen (`rankLabelHits`). Rettich zeigt höchstens drei. Die Person wählt einen davon oder keinen. Erst nach ihrer Wahl wird die Nummer des Produkts nachgeschlagen, wie bei der Namenssuche (ADR-0024).
4. **Ein sichtbarer Barcode geht vor:** Steht ein Barcode auf dem Foto, behandelt Rettich ihn wie einen gescannten Code (ADR-0016).
5. **Alles auf dem Gerät:** Foto und Text verlassen das Gerät nicht, das Foto wird nicht gespeichert. Ins Netz geht wie bisher nur eine Barcode-Nummer, und nur bei einem Barcode auf dem Foto oder nach der Wahl eines Vorschlags. Der vorgeschlagene Name löst keine Suche bei Open Food Facts aus.

## Folgen

- Frisches ohne Etikett (ein Apfel, ein Brot vom Bäcker) erkennt Rettich nicht: Auf dem Foto steht kein Text. Die App sagt das und lässt den Namen tippen. Lebensmittel am Aussehen zu erkennen bräuchte ein Bildmodell auf dem Gerät; das ist ein eigener Entscheid.
- Für ein Etikett liest Rettich das Foto zweimal (einmal als Block für die Quittung, einmal als verstreuter Text für das Etikett). Das dauert auf dem Handy einige Sekunden.

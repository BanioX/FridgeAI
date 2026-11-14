# ADR-0093: Sheets als Dialog auf grossen Bildschirmen

- **Status:** angenommen
- **Datum:** 2026-11-14
- **Entscheid von:** Claude (Alban, 14.11.2026: «Kannst du Rettich für Web, iPhone und iPad optimieren»)

## Kontext

Rettich öffnet kleine Aufgaben in einem Fenster, das von unten hereinkommt (Sheet): «Wo liegt das?», «Im Blick», Einfrieren, Bearbeiten mehrerer Artikel, Töpfe im Auswahlmodus, eine Packung öffnen. Auf dem iPhone ist das richtig. Auf dem iPad und am Computer hing das Fenster als breiter Streifen am unteren Rand, weit weg vom Blick. Auf dem iPad zeigen Apps solche Aufgaben als Dialog in der Mitte (Form Sheet, Human Interface Guidelines, ADR-0021). Ausserdem trugen die sechs Fenster dieselben Klassen sechsmal kopiert.

## Entscheid

- **Zwei gemeinsame Bausteine** in `index.css`: `sheet-backdrop` (abgedunkelter Hintergrund) und `sheet-panel` (das Fenster). Alle sechs Fenster nutzen sie; was nur eines braucht (Höhe, Abstände), steht weiter dort.
- **Unter 768 Pixeln** bleibt alles, wie es ist: von unten, oben gerundet, mit Abstand zum Home-Indikator.
- **Ab 768 Pixeln** (iPad, Computer, iPhone quer) steht das Fenster in der Mitte, höchstens 512 Pixel breit, rundum gerundet, mit Rand zum Bildschirm. Es ist höchstens so hoch wie der Bildschirm ohne Rand und scrollt sonst in sich: Ein iPhone quer ist breit, aber nur rund 390 Pixel hoch.

## Folgen

- `sheet-dialog.spec.ts` prüft am Fenster «Wo liegt das?» iPhone, iPad hochkant, Computer und iPhone quer: Lage, Breite, Barrierefreiheit.
- Ein neues Fenster nimmt `sheet-backdrop` und `sheet-panel`, statt Klassen zu kopieren.
- Der Kartenstapel der Quittung und der Foto-Betrachter bleiben bildschirmfüllend, sie sind keine kleinen Aufgaben.

# ADR-0092: Seitenleiste auf grossen Bildschirmen

- **Status:** angenommen
- **Datum:** 2026-11-14
- **Entscheid von:** Claude (Alban, 14.11.2026: «Kannst du Rettich für Web, iPhone und iPad optimieren»)

## Kontext

Rettich ist für das iPhone gebaut: eine Spalte von höchstens 576 Pixeln, die Tab-Leiste unten (ADR-0031, ADR-0041). Auf dem iPad und am Computer blieb davon eine schmale Handy-Spalte in der Mitte, mit viel leerem Rand und einer Tab-Leiste über die ganze Breite. Auf dem iPad zeigen Apps ihre Bereiche ab einer gewissen Breite in einer Seitenleiste links (Human Interface Guidelines, ADR-0021).

## Entscheid

- **Eine Navigation, zwei Formen:** Unter 1024 Pixeln Breite (iPhone, iPad hochkant, Split View) bleibt die Tab-Leiste unten. Ab 1024 Pixeln (iPad quer, Computer) ist dieselbe Liste eine Seitenleiste links, 256 Pixel breit, mit dem Rettich oben. Es gibt nur ein `<nav>` im Dokument; die Form wechselt nur über CSS. Screenreader, Tests und Tastatur sehen immer dieselbe Navigation.
- **Gleiche Reihenfolge:** Start, Vorrat, Erfassen, Wissen, Mehr, auch in der Seitenleiste. «Erfassen» ist dort eine dunkle Zeile in der Mitte statt eines Kreises. So folgt der Fokus dem Auge.
- **Breiterer Inhalt:** ab 768 Pixeln höchstens 672 Pixel, ab 1024 Pixeln höchstens 768 Pixel, rechts der Seitenleiste mittig. Schmaler bleibt der Text gut lesbar.
- **Leisten am unteren Rand** (Rückgängig, Auswahl, Abzeichen) sitzen ohne Tab-Leiste tiefer und in der Spalte des Inhalts, nicht über der Seitenleiste.
- Auf dem iPhone ändert sich nichts.

## Folgen

- Die E2E-Tests laufen in einem Fenster von 1280 Pixeln und sehen jetzt die Seitenleiste; alle bestehenden Tests blieben grün. `adaptive-layout.spec.ts` prüft iPhone, iPad hochkant, iPad quer und Computer: Lage der Navigation, Reihenfolge, kein seitliches Scrollen, Barrierefreiheit.
- Sheets kommen weiter von unten. Auf grossen Bildschirmen werden sie in einem Folge-PR zu Dialogen in der Mitte.

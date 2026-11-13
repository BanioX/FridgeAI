# ADR-0083: Mengen in Gramm und Milliliter auf einem Rad

- **Status:** angenommen
- **Datum:** 2026-11-13
- **Entscheid von:** Alban («Option, die Menge in Gramm mit einem Rad und ebenfalls in Milliliter und Liter anzuzeigen», 13.11.2026)

## Kontext

Auf der Artikelseite sagt «Wie viel?», wie viel verwertet oder entsorgt wurde: ¼, ⅓, ½, ⅔, ¾ oder alles. Eine andere Menge musste man bisher als Zahl tippen. Am Handy ist das umständlich, und man kann mehr eingeben, als da ist.

## Entscheid

1. **«Andere Menge …» öffnet bei Gramm und Milliliter ein Rad** wie die Auswahlräder des iPhones (`AmountWheel`): wischen oder scrollen, die Zeile in der Mitte gilt, ein Tipp auf eine Zeile wählt sie.
2. **Die Stufen** (`wheelValues`): 5 g oder 5 ml bis 100, 10 bis 1000, 50 darüber, und die ganze Restmenge als letzte Stufe. Mehr als da ist, geht nicht.
3. **Die Anzeige auf dem Rad** (`wheelText`): Gramm bis 1000, dann Kilo; Milliliter bis 1000, dann Liter, ohne Deziliter («750 ml», «1.5 l»).
4. **Das Rad startet bei etwa der Hälfte.**
5. **Für Tastatur und Screenreader** ist das Rad ein Drehfeld (`spinbutton`) mit Pfeiltasten, Bild auf/ab, Pos1 und Ende; es sagt den Wert in Worten («150 g»).
6. Stückware bleibt ein Tippfeld, weil dort Brüche wie «1¼» vorkommen.

## Folgen

- Eine Teilmenge braucht keine Tastatur mehr.
- Dasselbe Rad kann später die Menge beim Erfassen ersetzen.

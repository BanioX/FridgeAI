# ADR-0074: Ruhiger Start

- **Status:** angenommen
- **Datum:** 2026-11-13
- **Entscheid von:** Claude, auf Albans Wunsch («Premium, Simplicity, kein Stress, eventuell verschlanken», 13.11.2026)

## Kontext

Eine Prüfung aller Bildschirme mit Beispieldaten ergab: Start hatte neun Blöcke auf rund viereinhalb Bildschirmhöhen. «Heute retten», der Grund, Start zu öffnen, begann erst am unteren Rand des ersten Bildschirms, nach der Wert-Karte, vier Lagerort-Kacheln und der Karte zum Kühlschrank-Check. Hinweise wie Check und Sicherung waren grüne Karten mit Absatz und Knopf, der Fakt des Tages stand auf Start und unter «Wissen» mit demselben Satz.

## Entscheid

1. **Was zu tun ist, kommt zuerst.** Reihenfolge auf Start: Titel, Wert im Kühlschrank, «Heute retten», dann Hinweise, Lagerort-Kacheln, Bilanz.
2. **Der Wert ist eine Zeile.** Die dunkle Karte bleibt das eine dunkle Element auf Start, aber nur eine Zeile hoch: links «Im Kühlschrank» (und «teilweise geschätzt», wenn ein Preis fehlt), rechts der Betrag. Dafür hat `Card` die Polsterung `compact`.
3. **Hinweise sind Zeilen, keine Karten.** Kühlschrank-Check und Sicherung stehen, wenn fällig, als Zeilen einer gruppierten Liste wie unter «Mehr» (`MenuList`): Symbol, Titel, eine Zeile Erklärung, Pfeil. Die ganze Zeile ist der Link.
4. **Ein Ort pro Inhalt.** «Wusstest du schon?» steht vor dem ersten Artikel in der Einführung, nach einer Rettung (ADR-0042) und unter «Wissen», nicht mehr täglich auf Start.
5. **Leere Zustände sind leise.** «Nichts läuft in den nächsten 3 Tagen ab.» ist gedämpfter Text statt einer grünen Karte.

## Folgen

- Mit Beispieldaten steht der erste Artikel von «Heute retten» im ersten Bildschirm.
- Weitere Schritte derselben Prüfung folgen in eigenen PRs: eine Bedeutung pro Farbe, die Artikelseite mit «Verwertet» und «Entsorgt» oben, ein Weg für Fotos unter «Erfassen», «Mehr» in Gruppen.

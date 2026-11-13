# ADR-0084: Retten als Ritual auf Start

- **Status:** angenommen
- **Datum:** 2026-11-13
- **Entscheid von:** Alban («Viel zu wenig landet auf Gerettet. Man müsste es aktiv triggern. Retten muss smart sein. Leute können Dinge in einen Gerettet-Korb ziehen, ein Ritual, dass sich Retten toll anfühlt wie ein Achievement. Entsorgen sollte auch eine traurige Animation geben, aber motivierend, mit Witz und Awareness. Nur im Start, im Vorrat macht man es schnell schnell», 13.11.2026)

## Kontext

Seit ADR-0039 zählt eine Rettung nur, wenn die Person auf der Artikelseite «Ohne Rettich im Abfall gelandet? Ja, gerettet» bestätigt. Gewischt wurde auf Start und im Vorrat nur «Verwertet». So kam kaum eine Rettung zusammen, und Retten fühlte sich nach nichts an.

## Entscheid

1. **Auf Start ist Retten die Handlung selbst.** Wer einen Artikel aus «Heute retten» verwertet, der gerettet werden kann (`canBeRescued`: Datum heute, Mindesthaltbarkeit vorbei oder bald fällig bei Ware, die länger als eine Woche hält), hat ihn gerettet, ohne Rückfrage. Die Wisch-Fläche heisst dort «Gerettet».
2. **Halten und ziehen:** Ein langer Druck auf eine Zeile von «Heute retten» hebt sie an; unten erscheinen der Korb «Gerettet» und der Kübel «Entsorgt». Hineinziehen hält es fest.
3. **Der Moment nach einer Rettung:** Das Bild des Lebensmittels springt auf, Blätter fliegen heraus, dazu der Betrag und «Deine 8. Rettung diesen Monat · CHF 21.20». Mit «Rückgängig».
4. **Der Moment nach einem Verlust:** Das Bild kippt in den Kübel, dazu der Betrag «im Abfall» und ein Tipp für das nächste Mal: früher einfrieren, wenn es geht, sonst ein Tipp der Kategorie, sonst ein freundlicher Satz («Schade drum. Beim nächsten Mal bist du schneller.»). Mit «Rückgängig».
5. **Nur auf Start.** Im Vorrat bleibt Wischen schnell und ohne Moment. Die Artikelseite fragt wie bisher nach ADR-0039.
6. **Das Journal sagt «Gerettet»** für gerettete Einträge (`rescued` in `inventory.history`).
7. Ohne Bewegung (`prefers-reduced-motion`) erscheint dieselbe Karte ohne Animation.

## Folgen

- Rettungen entstehen dort, wo Rettich sie zeigt, und zählen in Bilanz, Abzeichen und dem wachsenden Rettich.
- Ehrlich bleibt es über `canBeRescued`: Ein frisches Brot zu essen ist keine Rettung (ADR-0039).
- Ziehen ist eine Abkürzung; Wischen und die Artikelseite bleiben die Wege für Tastatur und Screenreader.

# ADR-0078: Ein Weg für Fotos

- **Status:** angenommen
- **Datum:** 2026-11-13
- **Entscheid von:** Claude, auf Albans Wunsch («Simplicity, effizient», 13.11.2026)

## Kontext

Unter «Erfassen» standen eine grüne Kachel «Quittung hochladen» und fünf weisse Kacheln, darunter «Foto aufnehmen». Beide nahmen ein Foto einer Quittung an, denn «Foto aufnehmen» erkennt selbst, ob es eine Quittung oder eine Packung ist (ADR-0068). Wer eine Quittung fotografieren wollte, musste zuerst wählen, und hinter «Quittung hochladen» stand «Foto aufnehmen» nochmals.

## Entscheid

1. **Eine grüne Kachel «Quittung oder Packung fotografieren».** Ein Tipp öffnet direkt die Kamera (auf Geräten ohne Kamera die Dateiauswahl). Rettich liest das Foto auf dem Gerät und erkennt, ob es eine Quittung oder eine Packung ist.
2. **Die anderen Wege als eine gruppierte Liste:** «PDF oder Screenshot» (Quittungen aus der App des Ladens, auch mehrere), «Barcode scannen», «Von Hand», «Mehrere auf einmal», «Reste erfassen».
3. «Schnell erfassen» und der Hinweis für den ersten Bestand bleiben darunter. Keine Route ändert sich.

## Folgen

- Eine Quittung fotografieren: ein Entscheid weniger.
- Die Kamera startet weiter nur nach einem Tipp (Harte Regel), mit Dateiauswahl als Ausweg.

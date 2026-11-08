# ADR-0033: «Gerettet» heisst kurz vor Ablauf gegessen

- **Status:** angenommen; die Zählregel ist abgelöst durch [ADR-0039](0039-rescue-confirmed.md) («gerettet» nur auf Bestätigung)
- **Datum:** 2026-11-07

## Kontext

Alban beim Testen (7.11.2026): «Gerettet finde ich so schrecklich. Wenn man es gegessen hat, ist ja schön und recht … aber es ist ja nicht automatisch gerettet, man hat es einfach gegessen.»

Bisher zählte alles Gegessene und Weitergegebene als «gerettet». Damit war «Deine Wirkung» eigentlich ein Konsumzähler. Die Rettungsquote sagte wenig, und die Kosten des normalen Essens standen auf «Start», wo sie niemand sehen will.

## Entscheid

Alban hat gewählt:

- **Gerettet** ist, was gegessen oder weitergegeben wurde, während es **auf der Kippe** stand:
  - es lief in den Tagen von «Läuft bald ab» ab (3 Tage, im Notvorrat 90);
  - oder sein Mindesthaltbarkeitsdatum (MHD) war schon vorbei.
  - Nach dem Verbrauchsdatum ist Essen keine Rettung.
- **Gegessen, solange es frisch war,** ist Konsum. Es erscheint nicht in «Deine Wirkung», in der Rettungsquote und im Bericht «Deine Wirkung». Im Verlauf bleibt es sichtbar.
- **Speichern:** Beim Abschliessen merkt sich der Eintrag `atRisk`. So bleibt die Bewertung richtig, auch wenn das Datum des Artikels später ändert. «Ändern» im Verlauf behält `atRisk`: Wird aus «weggeworfen» «gegessen», zählt es als Rettung, wenn es knapp war.
- **Alte Einträge** (vor dem 7.11.2026) haben kein `atRisk` und zählen nicht als gerettet. Für den Pilot ist das ehrlich und einfach. Wer will, korrigiert sie im Verlauf.
- **Karte auf Start:** gerettet und weggeworfen in CHF und Anzahl Artikel, dazu «x % gerettet von allem, was knapp wurde», also gerettet geteilt durch (gerettet plus weggeworfen).
- `stats.waste` und `reports.build` liefern dazu `savedCount` und `wastedCount`. Die Feldnamen `saved…` bleiben und bedeuten jetzt «gerettet» im Sinne dieser Regel.

## Später, nicht jetzt

Alban: «Wir müssen aufpassen, dass wir uns nicht verzetteln.» Budget (was gibst du für Essen aus) sowie gesund und ungesund (Nutri-Score, kcal) werden eine eigene Funktion. Die Ideen stehen in [`../ideen/ausgaben-und-ernaehrung.md`](../ideen/ausgaben-und-ernaehrung.md).

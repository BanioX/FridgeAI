# ADR-0025: Suche beim Tippen

- **Status:** angenommen, ersetzt in ADR-0024 den Punkt «Open Food Facts erst auf Tipp»
- **Datum:** 2026-11-06

## Kontext

Alban (6.11.2026) nach dem ersten Test der Namenssuche: Er will keine automatischen Kategorien, dafür Treffer schon beim Tippen, ohne Knopf. In FridgeAI musste man nach dem Tippen auf «… suchen» tippen. Darüber sah man nur die geratene Kategorie mit Emoji.

Open Food Facts erlaubt 10 Suchen pro Minute und Person (ADR-0024).

## Entscheid

- **Kein Suchknopf mehr:** Ab drei Buchstaben fragt die App Open Food Facts (Schweiz), sobald du **600 ms** nicht mehr tippst. Unter «Bereits verwendet» erscheinen die eigenen Produkte schon ab zwei Buchstaben, ohne Netz.
- **Sparsam mit der Grenze:**
  - Jede Antwort wird gemerkt, solange das Formular offen ist. Dieselben Wörter fragen nicht zweimal.
  - Schlägt eine Suche fehl (offline, zu viele Suchen), fragt die App 30 Sekunden lang nicht mehr von selbst. «Nochmals suchen» fragt sofort.
- **Ruhige Liste:** Frühere Treffer bleiben stehen, bis die neuen da sind, wenn die Wörter weitergetippt sind («coop» → «coop g»).
- **Treffer ohne Kategorie-Emoji:** Name, darunter Marke und Packungsgrösse. Die Kategorie läuft nur noch im Hintergrund mit (für Ablaufdatum und Ort).
- **Datenfluss, von Alban gewünscht:** Neu gehen auch Wörter weg, die du nicht zu Ende getippt hast, sobald du kurz innehältst. Es bleibt derselbe Empfänger und dieselbe Art Daten wie in ADR-0024, ohne Cookies und Referrer. Die Datenschutzerklärung sagt das.
- **Tests:** Kein E2E-Test ruft Open Food Facts wirklich auf. `e2e/test.ts` beantwortet jede Suche leer, ein Test kann eigene Antworten setzen.

## Konsequenzen

- Erfassen per Name geht schnell, solange Open Food Facts das Produkt kennt.
- Wer langsam tippt, löst mehr Suchen aus. Zwei bis drei Suchen pro Produkt bleiben unter der Grenze. Wird sie überschritten, sagt die App das und die eigenen Produkte bleiben.
- Später denkbar: ein eigener, selbst gehosteter Auszug der Schweizer Open-Food-Facts-Daten für die Suche ganz ohne Netz (Lizenzfrage ODbL zuerst klären).

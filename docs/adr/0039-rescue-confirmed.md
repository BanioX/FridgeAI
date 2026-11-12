# ADR-0039: «Gerettet» nur, wenn du es bestätigst

- **Status:** angenommen, ersetzt die Zählregel von ADR-0033
- **Datum:** 2026-11-08
- **Entscheid von:** Alban, auf Claudes Vorschlag

## Kontext

Alban (8.11.2026): «Ich finde Quittung und ‹gerettet› irreführend. Wenn ich ein Brot kaufe, das 2 Tage haltbar ist, und ich es esse, dann ist es nicht gerettet. Das sollte das PDF nicht so ausweisen. Der Nutzer würde ‹gerettet› selber aktiv markieren müssen: Hey, danke Rettich, wenn du mich nicht erinnert hättest, hätte ich es entsorgen müssen.»

Nach ADR-0033 zählte als gerettet, was gegessen oder weitergegeben wurde, während es in den Tagen von «Läuft bald ab» lag. Kurzlebiges wie Brot, Milch, Salat oder Fertiggerichte liegt aber ab dem Kauf in diesem Fenster. Jedes normale Frühstück wurde so zur «Rettung».

## Entscheid

1. **Gegessen ist der Normalfall.** Essen, Wegwischen und «Gegessen» im Kühlschrank-Check zählen nie von selbst als Rettung.
2. **Gerettet nur auf Bestätigung.** Beim Abschliessen auf der Artikelseite fragt Rettich «Ohne Rettich im Abfall gelandet?» mit den Antworten «Ja, gerettet» und «Nein». «Nein» ist vorgewählt. Rettich fragt nur, wenn der Artikel wirklich auf der Kippe stand (`canBeRescued`):
   - sein Datum ist heute;
   - oder sein Mindesthaltbarkeitsdatum ist vorbei;
   - oder er liegt in den Tagen von «Läuft bald ab» und hielt ab dem Kauf länger als eine Woche. Joghurt ja, Brot nein.

   Nach dem Verbrauchsdatum fragt Rettich nie: Das ist kein Lebensmittel mehr.
3. **Gespeichert** wird `rescued: true` am Eintrag. Der Kern prüft die Regel selbst, eine falsche Bestätigung zählt nicht. Wird der Eintrag später zu «weggeworfen», fällt `rescued` weg. `atRisk` bleibt als Angabe «war knapp».
4. **Zählen:** Start, Bericht, Quittung und Rettungsquote zählen nur bestätigte Rettungen (`isRescue`). Die Rettungsquote ist gerettet geteilt durch gerettet plus weggeworfen.
5. **Alte Einträge** zählen ab jetzt als «gegessen», nicht als gerettet. Das ist ehrlich und betrifft nur den Pilot.
6. **Ein im Verlauf korrigierter Eintrag** (von «weggeworfen» zu «gegessen») ist gegessen, nicht gerettet: Er wurde nie bestätigt.

## Folgen

- Die Zahlen werden kleiner und dafür glaubwürdig. «So hast du Food Waste reduziert» stimmt dann wirklich.
- Die Belohnung für eine Bestätigung folgt (Alban: kein «Danke», dafür Food Facts und ein wachsender Rettich).

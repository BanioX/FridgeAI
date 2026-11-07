# ADR-0032: Die App heisst «Rettich»

- **Status:** angenommen
- **Datum:** 2026-11-07

## Kontext

Im App Store gibt es schon «Fridge AI: Food & Recipes» (duckma.app), eine KI-Rezept-App. Apple verlangt eindeutige App-Namen, und ein so ähnlicher Name birgt Verwechslungs- und Markenrisiken. Ausserdem passt «AI» nicht: Die App hat keine eingebaute KI. Sie lebt vom Vorrat, vom Bon, von den Preisen und vom Retten.

Alban (7.11.2026): «Wir bräuchten einen anderen Namen oder ein anderes Framing.»

Websuche vom 7.11.2026:
- «Restlos» ist im App Store schon vergeben, als Vorratsmanager.
- «Haltbar bis» ist als App vergeben.
- Für «Rettich» und «Frischling» habe ich keine App gefunden. Es gibt nur ein «RettIch-Regal» der Universität Tübingen, ein Regal für gerettete Lebensmittel, keine App.

## Entscheid

Alban hat **«Rettich»** gewählt: Rettich und retten in einem Wort.

- **Sichtbar heisst die App «Rettich»:** App-Name auf dem Home-Bildschirm, Seitentitel, Texte, PDF-Berichte, Exportdatei `rettich-JJJJ-MM-TT.json` und der Auftrag für die eigene KI.
- **Symbol:** ein weisser Rettich mit grünem Kraut auf dem App-Grün. In der Schweiz ist der Rettich weiss, rot ist das Radieschen.
- **Framing:** «Rettich rettet, was im Kühlschrank liegt.» Kurz: «Scan den Bon. Rette den Rest.» Im App Store zum Beispiel «Rettich: Vorrat & Reste retten».
- **Technisch bleibt alles beim Alten,** damit nichts bricht:
  - Repo `BanioX/FridgeAI` und Pakete `@fridgeai/*`;
  - die Web-Adresse `fridgeai.hyseni-alban.workers.dev`. Eine neue Adresse wäre für den Browser eine andere App, und die Pilot-Daten auf dem iPhone blieben zurück;
  - der Name der Datenbank auf dem Gerät;
  - das Exportformat `fridgeai-export` und der Schlüssel `"fridgeai": 1` im KI-Import. Alte Exporte und Antworten funktionieren weiter.

## Offen (entscheidet Alban, kostet zum Teil Geld)

1. **Markenprüfung:** «Rettich» in [swissreg.ch](https://www.swissreg.ch) und in der EUIPO-Suche prüfen, für die Klassen 9 (App) und 42 (Online-Dienst). Die Suche ist gratis. Aus der Cloud-Umgebung konnte Claude die Register nicht abfragen.
2. **Markeneintrag** beim IGE, falls gewünscht. Die Grundgebühr liegt im Bereich von einigen hundert Franken für bis zu drei Klassen. Den aktuellen Preis vor dem Entscheid auf ige.ch nachsehen.
3. **Domain,** z. B. `rettich.app` oder `rettich.ch`, falls frei. Kostet jährlich. Ein Umzug der Web-Adresse braucht dann einen Export und Import für die Pilot-Daten.
4. Das Repo später umbenennen (gratis, GitHub leitet weiter).

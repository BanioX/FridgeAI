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

## Nachtrag (7.11.2026): Schreibweise «rettich»

Alban: «Ich will rettich statt Rettich. Das Framing ist retten, nicht das Gemüse. Das Gemüse kann aber unser Logo bleiben.» Grundlage ist sein Masterplan (`docs/ideen/masterplan-bewertung.md`).

- **rettich, immer klein,** in der App, in PDFs, Dateinamen, Doku und Kommunikation. Klein liest man das Verb («rett' ich») und eine Tech-Marke, nicht das Substantiv.
- **Ausnahme Home-Bildschirm:** Unter dem Symbol steht «Rettich», gross geschrieben, damit es neben «Kalender» und «Fotos» ruhig wirkt (`apple-mobile-web-app-title`, `short_name` im Manifest).
- **Claim:** «Wirf kein Geld in den Kübel.»
- **Logo:** Der Rettich bleibt das Symbol.

## Nachtrag (8.11.2026): «Rettich» mit grossem R

Alban: «Wir wechseln doch auf Rettich statt rettich. Es macht mehr mit dem Auge.»

- Der Name steht überall mit grossem R: in allen Texten der App, im App-Namen (Manifest, Titel des Browsers), im PDF-Bericht, in README, CLAUDE.md, AGENTS.md und in der Design-Doku. Ein Test im Textkatalog prüft das.
- **Klein bleiben** technische Namen: Dateinamen (`rettich-bericht-….pdf`, `rettich-….json`), Kennungen im Code, die Domain (`rettich.app`, Parkplatz P8) sowie Repo, Pakete und Datenbank (`fridgeai`).
- Ältere ADRs bleiben, wie sie geschrieben wurden.

## Nachtrag (8.11.2026): «Abfall» statt «Kübel»

Alban: «Ich mag das Wort Kübel nicht.» Er hat gewählt: «Abfall». Das Wort ist Hochdeutsch und in der Schweiz, in Deutschland und in Österreich gebräuchlich.

- Der Claim heisst jetzt **«Wirf kein Geld in den Abfall.»**
- Texte sagen «Abfall», zum Beispiel «Was im Abfall landet». Ein Test im Textkatalog prüft das.


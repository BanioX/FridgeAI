# ADR-0032: Die App heisst «Rettich»

- **Status:** angenommen
- **Datum:** 2026-11-07

## Kontext

Der alte Name «FridgeAI» war im App Store schon sehr ähnlich vergeben. Apple verlangt eindeutige App-Namen, und ein so ähnlicher Name birgt Verwechslungs- und Markenrisiken. Ausserdem passt «AI» nicht: Die App hat keine eingebaute KI. Sie lebt vom Vorrat, von der Quittung, von den Preisen und vom Retten.

Alban (7.11.2026): «Wir bräuchten einen anderen Namen oder ein anderes Framing.»

## Entscheid

Alban hat **«Rettich»** gewählt: Rettich und retten in einem Wort.

- **Sichtbar heisst die App «Rettich»:** App-Name auf dem Home-Bildschirm, Seitentitel, Texte, PDF-Berichte, Exportdatei `rettich-JJJJ-MM-TT.json` und der Auftrag für die eigene KI.
- **Symbol:** ein weisser Rettich mit grünem Kraut auf dem App-Grün. In der Schweiz ist der Rettich weiss, rot ist das Radieschen.
- **Framing:** «Rettich rettet, was im Kühlschrank liegt.» Kurz: «Scan den Bon. Rette den Rest.»
- **Technisch bleibt alles beim Alten,** damit nichts bricht:
  - Repo `BanioX/FridgeAI` und Pakete `@fridgeai/*`;
  - die Web-Adresse `fridgeai.<konto>.workers.dev`. Eine neue Adresse wäre für den Browser eine andere App, und die Pilot-Daten auf dem iPhone blieben zurück;
  - der Name der Datenbank auf dem Gerät;
  - das Exportformat `fridgeai-export` und der Schlüssel `"fridgeai": 1` im KI-Import. Alte Exporte und Antworten funktionieren weiter.

## Nachtrag (7.11.2026): Schreibweise «rettich»

Alban: «Ich will rettich statt Rettich. Das Framing ist retten, nicht das Gemüse. Das Gemüse kann aber unser Logo bleiben.»

- **rettich, immer klein,** in der App, in PDFs, Dateinamen, Doku und Kommunikation. Klein liest man das Verb («rett' ich») und eine Tech-Marke, nicht das Substantiv.
- **Ausnahme Home-Bildschirm:** Unter dem Symbol steht «Rettich», gross geschrieben, damit es neben «Kalender» und «Fotos» ruhig wirkt (`apple-mobile-web-app-title`, `short_name` im Manifest).
- **Claim:** «Wirf kein Geld in den Kübel.»
- **Logo:** Der Rettich bleibt das Symbol.

## Nachtrag (8.11.2026): «Rettich» mit grossem R

Alban: «Wir wechseln doch auf Rettich statt rettich. Es macht mehr mit dem Auge.»

- Der Name steht überall mit grossem R: in allen Texten der App, im App-Namen (Manifest, Titel des Browsers), im PDF-Bericht, in README, CLAUDE.md, AGENTS.md und in der Design-Doku. Ein Test im Textkatalog prüft das.
- **Klein bleiben** technische Namen: Dateinamen (`rettich-bericht-….pdf`, `rettich-….json`), Kennungen im Code, die Domain sowie Repo, Pakete und Datenbank (`fridgeai`).
- Ältere ADRs bleiben, wie sie geschrieben wurden.

## Nachtrag (8.11.2026): «Abfall» statt «Kübel»

Alban: «Ich mag das Wort Kübel nicht.» Er hat gewählt: «Abfall». Das Wort ist Hochdeutsch und in der Schweiz, in Deutschland und in Österreich gebräuchlich.

- Der Claim heisst jetzt **«Wirf kein Geld in den Abfall.»**
- Texte sagen «Abfall», zum Beispiel «Was im Abfall landet». Ein Test im Textkatalog prüft das.


## Nachtrag (14.11.2026): Repo heisst `BanioX/Rettich`

Alban hat das Repo am 14.11.2026 von `BanioX/FridgeAI` in `BanioX/Rettich` umbenannt. GitHub leitet alte Adressen weiter: Links im Changelog, in PRs und Klone mit der alten Adresse funktionieren weiter. Neue Links nennen `BanioX/Rettich` (README, `security.txt`, Release-Skript, Crawler-Kennung, SWELPER-Kontext).

Technisch bleibt weiter `fridgeai`, weil ein Wechsel Daten kosten würde:

- Pakete `@fridgeai/*` und der Paketname im Wurzelverzeichnis;
- der Name der Datenbank auf dem Gerät und die Speicher-Schlüssel `fridgeai:*`: Ein neuer Name wäre für den Browser leerer Speicher;
- das Cloudflare-Projekt `fridgeai` und damit die Web-Adresse;
- das Exportformat `fridgeai-export`.

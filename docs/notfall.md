# Notfallkarte

Für den Fall, dass nach einem Update etwas nicht stimmt. Erst die App und die Daten sichern, dann die Ursache suchen. Jeder Merge auf `main` geht automatisch in die echte App ([`previews.md`](previews.md)), darum steht hier, wie man zurückkommt.

## 1. Die App geht nach einem Update nicht mehr

1. **Nichts löschen.** Rettich nicht vom Home-Bildschirm entfernen: Auf dem iPhone verschwinden damit meist auch alle Daten darin ([`pilot.md`](pilot.md)).
2. **Zur letzten guten Version zurück:** Im Cloudflare-Dashboard **Workers & Pages** → **fridgeai** → **Deployments**. Bei der letzten Version vor dem Fehler rechts auf die drei Punkte, dann **Rollback**. Das dauert Sekunden bis wenige Minuten.
3. **Auf dem Handy** Rettich ganz schliessen (aus der App-Übersicht wischen) und neu öffnen. Klappt es nicht sofort, ein zweites Mal: Die App lädt eine neue Version im Hintergrund.
4. **Claude Bescheid geben**, mit Screenshot. Der Fehler wird in einem eigenen PR behoben. Der nächste Merge veröffentlicht wieder automatisch und ersetzt den Rollback.

## 2. Daten sehen falsch aus oder fehlen

1. **Zuerst sichern:** «Mehr» → «Mitnehmen und löschen» → «Alles exportieren (JSON)». So bleibt erhalten, was noch da ist. Mit «Mit Passwort schützen» wird die Datei verschlüsselt; ohne das Passwort lässt sie sich nie mehr öffnen, es gibt keine Rettung (ADR-0087).
2. **Nicht** «Alles löschen» tippen.
3. Ein Rollback dreht **nur den Code** zurück, nicht die Daten: Die alte Version liest danach dieselbe Datenbank auf dem Gerät. Hat ein Update Daten verändert, hilft die letzte Sicherung: «Daten importieren (JSON)» ersetzt alles auf dem Gerät durch die Sicherung.
4. Die Sicherung nicht weitergeben und nicht ins Repo legen: Sie enthält Einkäufe und Namen.

## 3. Nie ohne Rücksprache

- Den Schutz von `main` lockern oder direkt auf `main` schreiben.
- Build- und Deploy-Befehle in den Cloudflare-Einstellungen ändern (Ausnahme: der Plan zu TD-24 in [`schulden.md`](schulden.md)).
- Schlüssel, Tokens oder Wiederherstellungscodes in Chats, Issues oder ins Repo schreiben.

## 4. Wer hilft

- **Claude:** In einer neuen Sitzung «Notfall:» und was passiert ist. Den Faden der Arbeit zeigt [`swelp/uebergabe.md`](swelp/uebergabe.md).
- **Konten:** GitHub, Cloudflare und die Domain gehören Alban. Zwei-Faktor-Schutz und Wiederherstellungscodes liegen bei ihm, an einem sicheren Ort ausserhalb dieses Repos.
- **Ein roter Vorschau-Build** ist kein Notfall: Er betrifft nur die Vorschau eines PRs, nicht die echte App ([`previews.md`](previews.md), L-34).

# Pilot: rettich ausprobieren

Für den ersten Pilot mit Alban und einer weiteren Person. Stand: v0.5.0. Claude gibt den Pilot frei (CLAUDE.md, Prioritäten).

## Einrichten (5 Minuten pro Person)

1. Auf dem iPhone in **Safari** öffnen: `https://fridgeai.hyseni-alban.workers.dev`.
   - Voraussetzung: In Cloudflare ist unter Domains «Production» eingeschaltet ([`previews.md`](./previews.md)).
2. **Auf den Home-Bildschirm legen:** unten «Teilen», dann «Zum Home-Bildschirm».
   - Das ist wichtig: Nur so behält das iPhone die Daten dauerhaft und startet rettich offline wie eine App.
3. rettich über das neue Symbol öffnen. Ein Konto gibt es noch nicht, alles bleibt auf dem Gerät.

## Was testen (eine Woche, Kühlschrank zuerst)

| Tag | Aufgabe | Achte auf |
| --- | --- | --- |
| 1 | 5 bis 10 Sachen aus dem Kühlschrank erfassen: Barcode scannen, sonst den Namen tippen | Ist der Scan scharf und schnell? Stimmen Name, Bild, Menge und Datum? |
| 2–6 | Jeden Tag kurz «Start» öffnen. Gegessenes, Weggeworfenes oder Weitergegebenes eintragen, auch Teile («⅓») | Ist es schneller als im Kopf? Fehlt eine Portion oder ein Grund? |
| 2–6 | Vor dem Einkaufen **«Nachkaufen»** unter «Mehr» nutzen (füllt sich auch, wenn du nach dem Aufbrauchen «Nachkaufen» tippst), nach dem Einkauf «In den Vorrat legen» | Hilft «Du hast noch …»? |
| 2–6 | Nach dem Einkauf den **Bon hochladen** (＋, dann «Bon hochladen»: PDF aus der Coop- oder Migros-App, Lidl-Screenshot oder Foto) | Stimmen Namen und Preise, stimmt die Summe? |
| 2–6 | Nach dem Einkauf die Standardartikel mit **«Schnell erfassen»** eintragen | Reicht ein Tipp, stimmen Menge und Ort? |
| 2–6 | Unter «Rezeptideen» etwas kochen, danach **«Zutaten abbuchen»** | Passen die Ideen zu dem, was weg muss? |
| 7 | Den **Kühlschrank-Check** auf «Start» machen, unter «Mehr» einen **Bericht als PDF** erstellen, «Deine Wirkung diesen Monat» ansehen, einmal «Alles exportieren» | Würdest du die App weiter nutzen? Was nervt? |

## Feedback

- Direkt an Alban: Screenshot plus ein Satz, was du erwartet hast. Alban gibt es an Claude weiter.
- Wichtig sind vor allem: «Das habe ich nicht gefunden», «Das war mir zu umständlich» und «Das hat nicht gestimmt».

## Bekannte Grenzen

- **Kein Teilen zwischen Handys:** Jede Person hat ihren eigenen Vorrat. Ein gemeinsamer Haushalt kommt mit Konten (Plan, Schritt 7).
- **Bons:** PDFs aus der Coop- und Migros-App werden am genauesten gelesen. Fotos und Screenshots können Ziffern verwechseln: Die Summenprüfung zeigt das, ein Tipp auf den Preis korrigiert ihn. Screenshots in voller Grösse hochladen, nicht über einen Chat verkleinert.
- **Scan im Browser:** Ist es unscharf, das Handy etwas weiter weg halten oder «Code aus Foto lesen» nutzen. Die native App-Variante steht in [`ideen/scan-und-produktdaten.md`](./ideen/scan-und-produktdaten.md).
- **Unbekannte Produkte:** Nicht jeder Barcode ist bei Open Food Facts. Einmal von Hand erfassen, beim nächsten Scan kennt rettich das Produkt.
- **Handywechsel:** Vorher «Alles exportieren». Ein Import kommt mit den Konten.
- **Keine Push-Mitteilungen:** Die App zeigt das Dringende beim Öffnen ([`ideen/benachrichtigungen.md`](./ideen/benachrichtigungen.md)).

## Daten und Datenschutz

Alles bleibt auf dem Gerät. Bons werden auf dem Handy gelesen und nie gespeichert, nur Name, Menge und Preis jeder Zeile. Beim Scannen geht nur die Barcode-Nummer an Open Food Facts (Name, Nährwerte, Bild), bei der Suche nur die getippten Wörter. Es gibt kein Tracking, keine Werbung und kein Konto. Mit «Alles löschen» unter «Mehr» → «Daten und Datenschutz» ist alles weg (ADR-0020).

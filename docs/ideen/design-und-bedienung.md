# Design und Bedienung

Ideen aus der Arbeit an der Apple-Designsprache (ADR-0021). Noch nicht beschlossen.

## Wischgesten in Listen

- **Nutzen:** Nach links wischen für «Gegessen», nach rechts für «Weggeworfen», wie in iOS Mail. Das spart den Weg über die Detailseite und passt zu den «No-Brainer»-Nutzer:innen.
- **Für wen:** alle, besonders beim täglichen Blick auf «Heute retten».
- **Aufwand:** M. Gesten, Rückgängig über den bestehenden Hinweis und eine Alternative per Tastatur und Screenreader (Aktionen-Menü) nötig.
- **Braucht:** nichts Neues. Läuft über `inventory.recordOutcome` mit «alles».
- **Geld:** nein, aber mehr Bindung.

## Detail als Sheet statt eigene Seite

- **Nutzen:** Ein Tipp auf einen Artikel öffnet ein Blatt von unten, die Liste bleibt dahinter sichtbar (iOS-Muster). Wegwischen schliesst es.
- **Aufwand:** M. Fokusführung, Zurück-Taste und Deep-Links auf `/inventory/:id` müssen weiter funktionieren.
- **Braucht:** nichts Neues.

## Dunkelmodus

- **Nutzen:** iOS und Android erwarten ihn, abends im Kühlschranklicht angenehmer.
- **Aufwand:** M. Zweiter Satz Farb-Tokens, alle Paare wieder auf WCAG AA prüfen und Vorschaubilder in beiden Modi.
- **Braucht:** nichts Neues.

## Status-Chip auf schmalen Handys

- **Beobachtung:** Bei 320 px Breite (iPhone SE der 1. Generation, grosse Systemschrift) drückt ein langer Chip wie «Nicht mehr essen» den Namen auf «Rauc…».
- **Idee:** Unter etwa 360 px den Chip unter den Namen setzen, oder ein kürzeres Label («abgelaufen») mit dem vollen Text für Screenreader.
- **Aufwand:** S.
- **Stand:** umgesetzt. Unter 360 px rutscht der Chip unter den Namen.

## Grosse Systemschrift (Dynamic Type)

- **Nutzen:** Ältere Menschen und Sehbehinderte stellen die Schrift gross. Die App nutzt schon `rem`, Zeilen und Reiter sollten dann umbrechen statt abschneiden.
- **Aufwand:** S bis M. Vorschaubilder mit 200 % Schrift aufnehmen und Engstellen beheben.

## Nachkaufen weiterdenken (nach ADR-0031)

- **Im Kühlschrank-Check:** Was dort als gegessen oder weggeworfen markiert wird, am Ende gesammelt anbieten: «3 Sachen nachkaufen?». Aufwand S.
- **Standardartikel:** Wenn ein Produkt aus «Schnell erfassen» aufgebraucht ist, «Nachkaufen» gleich vormerken (abschaltbar). Aufwand S.
- **＋ als Sheet:** Das Menü «Erfassen» als Blatt von unten statt als eigene Seite, wie das ＋ in Apples Erinnerungen. Aufwand S. Braucht eine Prüfung mit Screenreader.
- **Portionsgrössen im Katalog:** Das Wegwischen isst bei Gramm und Millilitern heute den Rest. Mit einer Portionsgrösse pro Kategorie (z. B. 125 g Joghurt, 2 dl Milch) isst es eine Portion; `swipePortion` kann sie schon. Aufwand S, Kosten keine.
- **Wegwischen auf Einkaufsliste und Kühlschrank-Check:** Dieselbe Geste zum Abhaken. Aufwand S.
- **Braucht:** nichts Neues, alles auf dem Gerät.


## Berichte weiterdenken (nach den Berichtsarten, 8.11.2026)

- **Quittung als Bild teilen:** Neben dem PDF ein PNG im Hochformat, das direkt in WhatsApp oder Instagram-Stories passt. Mehr Reichweite für Rettich ohne Werbung. Aufwand S (Canvas auf dem Gerät), Kosten keine.
- **Sonntags-Quittung:** Einmal pro Woche ein Hinweis «Deine Woche: CHF 12.40 gerettet», ein Tipp öffnet die Wirkungs-Quittung. Braucht Benachrichtigungen ([`benachrichtigungen.md`](benachrichtigungen.md)). Aufwand M.
- **«Läuft bald ab» als Kochplan:** Auf der Quittung pro Artikel ein passendes Rezept aus «Kochen». Aufwand S, alles auf dem Gerät.
- **Notvorrat als eigene Quittung:** Heute nur im ausführlichen Bericht. Mit Ablaufdaten wichtig für die Vorratsliste des Bundes. Aufwand S.
- **Mehrere Orte zusammen:** Kühlschrank und Tiefkühler auf einer Quittung, mit Zwischentotal pro Ort. Aufwand S.
- **Braucht:** nichts Neues; kein Datenfluss nach aussen.

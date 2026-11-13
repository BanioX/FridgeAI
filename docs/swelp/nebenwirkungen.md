# Tut: Nebenwirkungen von Rettich

Was der Code ausserhalb seiner selbst bewirkt: ans Netz senden, auf dem Gerät speichern, Geräte-Funktionen nutzen. Grundsatz (ADR-0003, ADR-0020): Daten bleiben auf dem Gerät. Was es verlässt, steht hier, und Alban hat es entschieden.

`apps/web/src/swelp.test.ts` liest die Tabellen «Netz» und «Gerätespeicher». Ändern sich Hosts in der CSP (`apps/web/public/_headers`) oder Speicher-Schlüssel im Code, schlägt er fehl, bis diese Datei stimmt. Die Spalte «Host» und «Schlüssel» bitte genau so schreiben.

## Netz

| Kennung | Host | Was geht raus | Wann | Entscheid |
| --- | --- | --- | --- | --- |
| SE-01 | `world.openfoodfacts.org` | Barcode-Nummer; getippte Suchwörter; Produktwörter von Quittungs-Zeilen ohne sicheren Treffer im mitgelieferten Katalog (ohne Preise, Laden, Datum), dazu technisch die IP-Adresse | Scannen oder Eintippen eines unbekannten Barcodes; Namenssuche ab drei Buchstaben; automatisch nach dem Auslesen einer Quittung | ADR-0016, ADR-0025, ADR-0036 |
| SE-02 | `images.openfoodfacts.org` | Abruf des Packungsbilds (nur die Bildadresse), IP-Adresse | einmal pro Barcode, danach liegt das Bild auf dem Gerät | ADR-0016 |
| SE-03 | eigene Herkunft (`'self'`, Cloudflare) | Abruf der App-Dateien, IP-Adresse, Browserdaten | Öffnen und Updates; Rettich wertet nichts aus | ADR-0013 |

## Gerätespeicher

| Kennung | Ort | Schlüssel | Was | Wie lange |
| --- | --- | --- | --- | --- |
| SE-10 | IndexedDB | `fridgeai` | Haushalt, Personen (nur Namen), Vorrat, Abschlüsse, Einkaufsliste, Quittungen (Zeilen, nie Bilder), Ereignisse, Produkt-Cache, Packungsbilder | bis zum Löschen in «Mehr» (ADR-0020) |
| SE-11 | localStorage | `fridgeai:last-fridge-check` | Tag des letzten Kühlschrank-Checks | bis zum Löschen der Website-Daten |
| SE-12 | sessionStorage | `fridgeai:reloaded-for-update` | Zeitpunkt des letzten Neuladens für ein Update | bis der Tab zu ist |
| SE-13 | Cache Storage | Service Worker (Workbox) | App-Dateien, OCR-Modelle und der Produktkatalog (`/catalog/*.json`, Cache `catalog`) für den Offline-Betrieb | bis zum nächsten Update; der Katalog wird im Hintergrund erneuert |
| SE-14 | localStorage | `fridgeai:swipe-tip-seen` | Tipp «Wisch einen Artikel nach links» schon gesehen | bis zum Löschen der Website-Daten |
| SE-26 | localStorage | `fridgeai:last-backup` | Tag des letzten Exports (nach einem Import: Exportdatum der Datei; nach «Alle Daten löschen» entfernt) auf diesem Gerät, für «Letzte Sicherung» und den Monats-Hinweis auf Start | bis zum Löschen der Website-Daten |
| SE-27 | localStorage | `fridgeai:inventory-view` | Ansicht im Vorrat: «Nach Ablauf» oder «Nach Art» (ADR-0067) | bis zum Löschen der Website-Daten |
| SE-28 | localStorage | `fridgeai:app-lock` | Kennung des Zugangsschlüssels der App-Sperre (nicht geheim) und «Sperren nach»; bewusst nicht in der Datenbank und nicht im Export (ADR-0086) | bis zum Ausschalten oder Löschen der Website-Daten |
| SE-30 | localStorage | `fridgeai:week-review-seen` | Montag der Woche, deren Rückblick «Gesehen» ist; blendet «Deine Woche» bis zur nächsten Woche aus, nicht im Export (ADR-0090) | bis zum Löschen der Website-Daten |
| SE-31 | localStorage | `fridgeai:feedback-ask` | «Später» (bis wann) und «Nicht mehr fragen» für die Frage nach einer Woche; nicht im Export (ADR-0089) | bis zum Löschen der Website-Daten |

## Geräte-Funktionen

| Kennung | Funktion | Wofür | Wann |
| --- | --- | --- | --- |
| SE-20 | Kamera (`getUserMedia`) | Barcode scannen, Licht | nur nach einem Tipp, ADR-0014 |
| SE-21 | Dateiauswahl / Kamera-App (`capture`) | Quittung, Code, Nährwerttabelle als Bild; Licht auf dem iPhone | nur nach einem Tipp. Bilder werden gelesen, nie gespeichert |
| SE-22 | Vibration (`navigator.vibrate`) | kurzes Feedback nach einem Scan oder Wischen | wo das Gerät es kann |
| SE-23 | Teilen (`navigator.share`) | PDF-Bericht teilen; Einkaufsliste als Text teilen («Liste teilen», sonst Zwischenablage) | nur nach einem Tipp |
| SE-24 | Dauerhafter Speicher (`navigator.storage.persist`) | Browser soll die Daten nicht bei Platzmangel löschen | beim Start |
| SE-25 | Kamera-App / Fotoauswahl (`capture`) für Plätze | Foto vom Schrank oder Fach («Wo ist was?») | nur nach einem Tipp. Das verkleinerte Foto bleibt auf dem Gerät und gehört zum Export, ADR-0056 |
| SE-29 | Gerät entsperren (WebAuthn, `navigator.credentials`) | App-Sperre: Face ID, Touch ID oder Code des Geräts bestätigen; kein Server, nichts verlässt das Gerät, ADR-0086 | nur nach einem Tipp, und beim Öffnen, wenn die Sperre an ist |

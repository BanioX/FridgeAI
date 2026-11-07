# Tut: Nebenwirkungen von rettich

Was der Code ausserhalb seiner selbst bewirkt: ans Netz senden, auf dem Gerät speichern, Geräte-Funktionen nutzen. Grundsatz (ADR-0003, ADR-0020): Daten bleiben auf dem Gerät. Was es verlässt, steht hier, und Alban hat es entschieden.

`apps/web/src/swelp.test.ts` liest die Tabellen «Netz» und «Gerätespeicher». Ändern sich Hosts in der CSP (`apps/web/public/_headers`) oder Speicher-Schlüssel im Code, schlägt er fehl, bis diese Datei stimmt. Die Spalte «Host» und «Schlüssel» bitte genau so schreiben.

## Netz

| Kennung | Host | Was geht raus | Wann | Entscheid |
| --- | --- | --- | --- | --- |
| SE-01 | `world.openfoodfacts.org` | Barcode-Nummer; getippte Suchwörter; Produktwörter gewählter Quittungs-Zeilen (ohne Preise, Laden, Datum), dazu technisch die IP-Adresse | Scannen oder Eintippen eines unbekannten Barcodes; Namenssuche ab drei Buchstaben; automatisch nach dem Auslesen einer Quittung | ADR-0016, ADR-0025, ADR-0036 |
| SE-02 | `images.openfoodfacts.org` | Abruf des Packungsbilds (nur die Bildadresse), IP-Adresse | einmal pro Barcode, danach liegt das Bild auf dem Gerät | ADR-0016 |
| SE-03 | eigene Herkunft (`'self'`, Cloudflare) | Abruf der App-Dateien, IP-Adresse, Browserdaten | Öffnen und Updates; rettich wertet nichts aus | ADR-0013 |

## Gerätespeicher

| Kennung | Ort | Schlüssel | Was | Wie lange |
| --- | --- | --- | --- | --- |
| SE-10 | IndexedDB | `fridgeai` | Haushalt, Vorrat, Abschlüsse, Einkaufsliste, Quittungen (Zeilen, nie Bilder), Ereignisse, Produkt-Cache, Packungsbilder | bis zum Löschen in «Mehr» (ADR-0020) |
| SE-11 | localStorage | `fridgeai:last-fridge-check` | Tag des letzten Kühlschrank-Checks | bis zum Löschen der Website-Daten |
| SE-12 | sessionStorage | `fridgeai:reloaded-for-update` | Zeitpunkt des letzten Neuladens für ein Update | bis der Tab zu ist |
| SE-13 | Cache Storage | Service Worker (Workbox) | App-Dateien und OCR-Modelle für den Offline-Betrieb | bis zum nächsten Update |

## Geräte-Funktionen

| Kennung | Funktion | Wofür | Wann |
| --- | --- | --- | --- |
| SE-20 | Kamera (`getUserMedia`) | Barcode scannen, Licht | nur nach einem Tipp, ADR-0007 |
| SE-21 | Dateiauswahl / Kamera-App (`capture`) | Quittung, Code, Nährwerttabelle als Bild; Licht auf dem iPhone | nur nach einem Tipp. Bilder werden gelesen, nie gespeichert |
| SE-22 | Vibration (`navigator.vibrate`) | kurzes Feedback nach einem Scan | wo das Gerät es kann |
| SE-23 | Teilen (`navigator.share`) | PDF-Bericht teilen | nur nach einem Tipp |
| SE-24 | Dauerhafter Speicher (`navigator.storage.persist`) | Browser soll die Daten nicht bei Platzmangel löschen | beim Start |

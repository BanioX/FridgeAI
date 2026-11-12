# Datenschutz bei Rettich (Entwurf)

> **Entwurf, keine Rechtsberatung.** Stand: v0.11.0, 8. November 2026. Vor einem öffentlichen Start prüfen Alban und eine Fachperson diesen Text (Plan 12d). Massstab: Schweizer Datenschutzgesetz (DSG), für Nutzer:innen in der EU die DSGVO.

## Kurz gesagt

- Dein Vorrat, deine Einkaufsliste und deine Statistik bleiben **auf deinem Gerät**. Es gibt kein Konto und keinen Rettich-Server mit deinen Daten.
- Beim Scannen geht **nur die Barcode-Nummer** an Open Food Facts, damit Name, Nährwerte und Packungsbild kommen. Suchst du ein Produkt nach Namen, gehen ab drei Buchstaben **nur die getippten Wörter** dorthin, sobald du kurz mit Tippen innehältst. Liest Rettich eine Quittung, sucht es jede Zeile zuerst bei früheren Quittungen und im mitgelieferten Katalog, auf dem Gerät. Nur Zeilen ohne sicheren Treffer gehen als **Produktname** an Open Food Facts, ohne Preise, Laden und Datum.
- Fotos von Codes, Quittungen und Nährwerttabellen (auch Screenshots) sowie Quittungs-PDFs werden auf dem Gerät gelesen und **nie gespeichert**.
- **Kein Tracking, keine Werbung, keine Cookies.**
- Du kannst jederzeit **alles exportieren** (JSON) und **alles löschen** («Mehr» › «Deine Daten»).

## Wer ist verantwortlich

Alban Hyseni, Schweiz. Kontakt: _[E-Mail-Adresse vor dem Start eintragen]_.

## Welche Daten Rettich speichert, und wo

Alles liegt im Speicher deines Browsers auf diesem Gerät (IndexedDB). Ohne dein Zutun verlässt nichts davon das Gerät.

| Was | Wozu |
| --- | --- |
| Artikel im Vorrat: Name, Kategorie, Ort, Menge, Ablaufdatum, Preis (falls erfasst) | Damit Rettich weiss, was du hast und was bald abläuft |
| Abschlüsse: verwertet oder entsorgt (ältere Einträge auch «weitergegeben»), mit Grund und Wert | Rückgängig, die «Bilanz» des Monats, das «Journal» |
| Einkaufsliste | «Du hast noch …» gegen Doppelkäufe |
| Gelesene Quittungen: Laden, Datum, Total und pro Zeile Name, Menge, Preis, Rabatt (nie Foto, PDF oder Karten- und Kundennummern) | Echte Preise im Vorrat, später dein Preisgedächtnis |
| Produkte, die du schon erfasst hast, und «Schnell erfassen» | Damit der nächste Scan oder Tipp schneller geht |
| Antworten von Open Food Facts und Packungsbilder | Damit derselbe Barcode auch offline erkannt wird (30 Tage) |
| Der mitgelieferte Produktkatalog (rund 7'000 Schweizer Produkte, Datei der App, im Cache des Browsers) | Damit Quittungszeilen auf dem Gerät erkannt werden, auch offline. Er enthält keine Daten von dir |
| Verlauf der Änderungen (Ereignisse) | Rückgängig, Export, später der Abgleich zwischen Geräten |

Zusätzlich merkt sich der Browser zwei Kleinigkeiten ohne Personenbezug:
- das Datum deines letzten Kühlschrank-Checks (`localStorage`), damit die Karte nur einmal pro Woche erscheint;
- ob die App nach einem Update gerade neu geladen hat (`sessionStorage`, nur bis zum Schliessen des Tabs).

## Was das Gerät verlässt

| Empfänger | Was | Wann |
| --- | --- | --- |
| **Open Food Facts** (offene Produktdatenbank, Frankreich) | Die Barcode-Nummer, dazu technisch deine IP-Adresse | Wenn du einen Barcode scannst oder eintippst, den Rettich noch nicht kennt |
| **Open Food Facts, Suche** | Die getippten Wörter (z. B. «Coop Gipfeli»), dazu technisch deine IP-Adresse | Wenn du im Feld «Was ist es?» mindestens drei Buchstaben tippst und kurz innehältst |
| **Open Food Facts, Quittungs-Abgleich** | Nur für Zeilen, die Rettich weder aus deinen früheren Quittungen noch im mitgelieferten Katalog sicher kennt: die Produktwörter ohne Packungsgrösse (z. B. «Naturaplan Bio Coconutwater»), einzeln nacheinander, dazu technisch deine IP-Adresse. Nie Preise, Mengen, Laden, Datum oder Uhrzeit | Automatisch nach dem Auslesen einer Quittung (Albans Entscheid vom 7.11.2026, ADR-0036; zuerst der Katalog seit ADR-0045). Scannst du bei einer Zeile den Barcode, geht nur die Barcode-Nummer raus |
| **Open Food Facts, Bildserver** | Abruf des Packungsbilds, dazu technisch deine IP-Adresse | Einmal pro Barcode, danach liegt das Bild auf dem Gerät |
| **Cloudflare** (Hoster der App) | Abruf der App-Dateien, dazu technisch deine IP-Adresse und Browserdaten | Beim Öffnen und bei Updates; Rettich wertet das nicht aus |

Andere Verbindungen erlaubt die App nicht: Eine Content-Security-Policy lässt nur die App selbst und die beiden Open-Food-Facts-Adressen zu.

## Kamera und Fotos

- Die Kamera startet nur, wenn du «Kamera starten» antippst. Du kannst sie verweigern und den Code als Foto wählen oder die Nummer eintippen.
- Bilder werden auf dem Gerät nach einem Code oder einer Nährwerttabelle durchsucht und danach verworfen. Es gibt keinen Upload. Von einer Nährwerttabelle bleiben nur die Zahlen, die du mit «Speichern» bestätigst.

## Wie lange

| Daten | Wie lange |
| --- | --- |
| Aktiver Vorrat und Einkaufsliste | solange du sie brauchst |
| Abschlüsse und Verlauf | auf dem Gerät, bis du sie löschst. Geplant (ADR-0020): nach 24 Monaten bleiben nur Monatssummen |
| Antworten von Open Food Facts | 30 Tage, dann wird neu gefragt |
| Fotos von Codes, Quittungen und Nährwerttabellen | nie gespeichert |

## Deine Rechte

- **Auskunft und Herausgabe:** «Mehr» › «Deine Daten» › «Alles exportieren» gibt dir alle Daten als JSON.
- **Löschung:** «Mehr» › «Deine Daten» › «Alles löschen» entfernt die ganze lokale Datenbank. Einzelne Artikel löschst du auf ihrer Detailseite.
- **Berichtigung:** Jeder Artikel lässt sich bearbeiten.
- Bei Fragen oder Beschwerden: Kontakt oben, in der Schweiz auch der Eidgenössische Datenschutz- und Öffentlichkeitsbeauftragte (EDÖB).

## Später: Konto und Teilen

Mit Konten (Plan Schritt 7) kommen ein Server und das Teilen im Haushalt. Dann gelten zusätzlich die Regeln aus [ADR-0020](./adr/0020-accounts-export-retention.md): Löschen wirkt auch auf dem Server, Backups höchstens 30 Tage, Server-Logs 14 Tage ohne Inhalte. Partner oder KI bekommen Zugriff nur mit deiner ausdrücklichen, widerrufbaren Einwilligung. Einzeldaten werden nie verkauft. Bevor Daten neu das Gerät verlassen, wird dieser Text angepasst.

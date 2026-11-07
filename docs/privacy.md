# Datenschutz bei FridgeAI (Entwurf)

> **Entwurf, keine Rechtsberatung.** Stand: v0.4.0, 6. November 2026. Vor einem öffentlichen Start prüfen Alban und eine Fachperson diesen Text (Plan 12d). Massstab: Schweizer Datenschutzgesetz (DSG), für Nutzer:innen in der EU die DSGVO.

## Kurz gesagt

- Dein Vorrat, deine Einkaufsliste und deine Statistik bleiben **auf deinem Gerät**. Es gibt kein Konto und keinen FridgeAI-Server mit deinen Daten.
- Beim Scannen geht **nur die Barcode-Nummer** an Open Food Facts, damit Name, Nährwerte und Packungsbild kommen. Suchst du ein Produkt nach Namen, gehen ab drei Buchstaben **nur die getippten Wörter** dorthin, sobald du kurz mit Tippen innehältst.
- Fotos von Codes werden auf dem Gerät gelesen und **nie gespeichert**.
- **Kein Tracking, keine Werbung, keine Cookies.**
- Du kannst jederzeit **alles exportieren** (JSON, CSV) und **alles löschen** («Haushalt»).

## Wer ist verantwortlich

Alban Hyseni, Schweiz. Kontakt: _[E-Mail-Adresse vor dem Start eintragen]_.

## Welche Daten FridgeAI speichert, und wo

Alles liegt im Speicher deines Browsers auf diesem Gerät (IndexedDB). Ohne dein Zutun verlässt nichts davon das Gerät.

| Was | Wozu |
| --- | --- |
| Artikel im Vorrat: Name, Kategorie, Ort, Menge, Ablaufdatum, Preis (falls erfasst) | Damit FridgeAI weiss, was du hast und was bald abläuft |
| Abschlüsse: gegessen, weitergegeben, weggeworfen, mit Grund und Wert | Rückgängig, «Deine Wirkung diesen Monat» |
| Einkaufsliste | «Du hast noch …» gegen Doppelkäufe |
| Gelesene Bons: Laden, Datum, Total und pro Zeile Name, Menge, Preis, Rabatt (nie Foto, PDF oder Karten- und Kundennummern) | Echte Preise im Vorrat, später dein Preisgedächtnis |
| Produkte, die du schon erfasst hast, und «Schnell erfassen» | Damit der nächste Scan oder Tipp schneller geht |
| Antworten von Open Food Facts und Packungsbilder | Damit derselbe Barcode auch offline erkannt wird (30 Tage) |
| Verlauf der Änderungen (Ereignisse) | Rückgängig, Export, später der Abgleich zwischen Geräten |

Zusätzlich merkt sich der Browser zwei Kleinigkeiten ohne Personenbezug:
- das Datum deines letzten Kühlschrank-Checks (`localStorage`), damit die Karte nur einmal pro Woche erscheint;
- ob die App nach einem Update gerade neu geladen hat (`sessionStorage`, nur bis zum Schliessen des Tabs).

## Was das Gerät verlässt

| Empfänger | Was | Wann |
| --- | --- | --- |
| **Open Food Facts** (offene Produktdatenbank, Frankreich) | Die Barcode-Nummer, dazu technisch deine IP-Adresse | Wenn du einen Barcode scannst oder eintippst, den FridgeAI noch nicht kennt |
| **Open Food Facts, Suche** | Die getippten Wörter (z. B. «Coop Gipfeli»), dazu technisch deine IP-Adresse | Wenn du im Feld «Was ist es?» mindestens drei Buchstaben tippst und kurz innehältst (wie bei Yazio) |
| **Open Food Facts, Bildserver** | Abruf des Packungsbilds, dazu technisch deine IP-Adresse | Einmal pro Barcode, danach liegt das Bild auf dem Gerät |
| **Cloudflare** (Hoster der App) | Abruf der App-Dateien, dazu technisch deine IP-Adresse und Browserdaten | Beim Öffnen und bei Updates; FridgeAI wertet das nicht aus |
| **Deine eigene KI** (z. B. ChatGPT, Claude) | Nur was du selbst kopierst und einfügst | Beim KI-Import, auf deinen Wunsch; FridgeAI selbst sendet nichts |

Andere Verbindungen erlaubt die App nicht: Eine Content-Security-Policy lässt nur die App selbst und die beiden Open-Food-Facts-Adressen zu.

## Kamera und Fotos

- Die Kamera startet nur, wenn du «Kamera starten» antippst. Du kannst sie verweigern und den Code als Foto wählen oder die Nummer eintippen.
- Bilder werden auf dem Gerät nach einem Code durchsucht und danach verworfen. Es gibt keinen Upload.

## Wie lange

| Daten | Wie lange |
| --- | --- |
| Aktiver Vorrat und Einkaufsliste | solange du sie brauchst |
| Abschlüsse und Verlauf | auf dem Gerät, bis du sie löschst. Geplant (ADR-0020): nach 24 Monaten bleiben nur Monatssummen |
| Antworten von Open Food Facts | 30 Tage, dann wird neu gefragt |
| Fotos von Codes und Bons | nie gespeichert |

## Deine Rechte

- **Auskunft und Herausgabe:** «Haushalt» → «Alles exportieren» gibt dir alle Daten als JSON, den Vorrat auch als CSV.
- **Löschung:** «Haushalt» → «Alles löschen» entfernt die ganze lokale Datenbank. Einzelne Artikel löschst du auf ihrer Detailseite.
- **Berichtigung:** Jeder Artikel lässt sich bearbeiten.
- Bei Fragen oder Beschwerden: Kontakt oben, in der Schweiz auch der Eidgenössische Datenschutz- und Öffentlichkeitsbeauftragte (EDÖB).

## Später: Konto und Teilen

Mit Konten (Plan Schritt 7) kommen ein Server und das Teilen im Haushalt. Dann gelten zusätzlich die Regeln aus [ADR-0020](./adr/0020-accounts-export-retention.md): Löschen wirkt auch auf dem Server, Backups höchstens 30 Tage, Server-Logs 14 Tage ohne Inhalte. Partner oder KI bekommen Zugriff nur mit deiner ausdrücklichen, widerrufbaren Einwilligung. Einzeldaten werden nie verkauft. Bevor Daten neu das Gerät verlassen, wird dieser Text angepasst.

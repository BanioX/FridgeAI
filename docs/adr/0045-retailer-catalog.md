# ADR-0045: Produktdaten der Händler sammeln (höflicher Crawler)

- **Status:** angenommen
- **Datum:** 2026-11-08
- **Entscheid von:** Alban (Sammeln trotz rechtlicher Bedenken), Leitplanken und Umsetzung Claude

## Kontext

Bisher galt: keine Daten von den Websites der Händler, nur Open Food Facts und was die Person selbst erfasst ([`produktdaten.md`](../ideen/produktdaten.md)). Alban (8.11.2026): «Ich will, dass du trotz der Bedenken wegen der Erlaubnis die Seiten von Migros, Coop, Denner, Aldi und Lidl crawlst oder die Produktinfos holst, weil die Daten öffentlich auf der Website ersichtlich sind. Wenn es eine rechtliche Auseinandersetzung gibt, einige ich mich, aber bis dahin brauchen wir es als Motor für unsere App. Später können weitere Geschäfte dazukommen.»

Rechtliche Lage (keine Rechtsberatung): Das Lesen öffentlicher Seiten ist eine Grauzone. Am ehesten greift das UWG (Art. 5 lit. c: Übernahme eines marktreifen Arbeitsergebnisses mit technischen Mitteln). Fotos und Werbetexte sind urheberrechtlich geschützt, reine Fakten wie Name, Marke, Grösse und Zutaten kaum. Die Schweiz kennt keinen eigenen Datenbankschutz, die EU schon (wichtig für DACH). Albans Risiko, er hat entschieden.

## Was die Händler zulassen (Stand 8.11.2026)

| Händler | robots.txt | Technisch | Inhalt |
| --- | --- | --- | --- |
| Aldi Suisse | Produktseiten erlaubt, Sitemap für Produkte | offen | etwa 2'640 Produkte: Name, Marke, Grösse, Zutaten, kein Barcode |
| Lidl Schweiz | Produktseiten erlaubt, Sitemap | offen | etwa 690 Seiten, meist Non-Food und Aktionen |
| Denner | erlaubt | offen | online nur der Weinshop (etwa 770 Weine) |
| Migros | Produktseiten erlaubt | Server antwortet Bots mit 403 | – |
| Coop | – | Bot-Schutz mit Captcha (DataDome) schon auf robots.txt | – |

## Entscheid

1. **Rettich sammelt öffentliche Produktdaten** der Händler-Websites, wo sie technisch erreichbar sind. Heute ist das Aldi (1'700 Lebensmittel). Lidl und Denner zeigen online kaum Lebensmittel (Aktionen, Weine) und folgen, wenn sich das ändert.
2. **Leitplanken, nicht verhandelbar:**
   - **Kein Umgehen von Schutz:** keine Tarnung als Browser, kein Lösen von Captchas, keine wechselnden IP-Adressen und kein Login. Eine technische Sperre ist ein ausdrückliches Nein des Betreibers. Sie auszuhebeln ist keine Grauzone mehr und kann strafrechtlich relevant werden; das lässt sich nicht später per Einigung lösen. Migros und Coop fallen darum weg, solange sie sperren.
   - **Ehrlicher Name** «RettichBot» mit Link zur App. **robots.txt wird beachtet**, höchstens eine Anfrage pro Sekunde und Händler.
   - **Nur Fakten:** Name, Marke, Grösse, Kategorie, Zutaten, Händler-Nummer und Barcode, falls vorhanden. Keine Bilder, keine Werbetexte, keine Preise ohne eigenen Entscheid.
   - **Stopp auf Zuruf:** Verlangt ein Händler, dass Rettich aufhört, endet das Sammeln für ihn sofort, und seine Daten werden mit dem nächsten Release entfernt.
3. **Migros und Coop über Open Food Facts:** etwa 10'000 Migros- und 2'300 Coop-Produkte aus der Schweiz, mit Barcode und Laden. Die Lizenz ist ODbL: Quelle nennen («Daten von Open Food Facts»), und der daraus gebaute Datensatz steht unter derselben Lizenz. Abgefragt wird höchstens alle 7 Sekunden (Regel von Open Food Facts für die Suche).
4. **Auf dem Gerät:** Der Katalog wird als selbst gehostete Datei mit der App ausgeliefert und auf dem Gerät durchsucht. Keine Suchanfrage und keine Quittung geht dafür an einen Händler. Damit entsteht kein neuer Datenfluss von Personendaten.
5. **Gesammelt wird ausserhalb der App:** mit Skripten im Repo (`scripts/catalog/`: `crawl-aldi.mjs`, `off-stores.mjs`, `build.mjs`), heute von Hand in einer Sitzung. Daraus entstehen `apps/web/public/catalog/off-ch.json` (Open Food Facts, ODbL, 2'879 Produkte mit Barcode) und `retail-ch.json` (Händler-Websites). Getrennte Dateien, damit ein Händler auf Zuruf mit einer Datei verschwindet und die ODbL nur für den Open-Food-Facts-Teil gilt. Ob es regelmässig über GitHub Actions läuft, entscheidet Alban (Minuten aus dem Pro-Kontingent).
6. **Neue Händler** kommen mit derselben Prüfung dazu: robots.txt, technische Erreichbarkeit, was die Seiten an Fakten zeigen.

## Folgen

- Die Regel in `CLAUDE.md` heisst neu: keine Partner-Anbindungen mit Verträgen, Konten oder Bestellungen ohne Albans Entscheid, nur Mocks. Öffentliche Produktdaten nach diesem ADR sind erlaubt.
- Erster Nutzen: Zeilen auf Quittungen von Aldi, Lidl, Migros und Coop werden besser erkannt (Name, Marke, Grösse und damit Kategorie und Haltbarkeit). Später: Suche beim Erfassen und der Hinweis auf kleinere Packungen.
- Die Partnerschaft mit Migros und Coop (Parkplatz P1) bleibt der Weg zu vollständigen Daten.

## Umsetzung: Abgleich auf dem Gerät

- `parseCatalogFile` und `localCatalogSearch` in `packages/core` lesen `off-ch.json` und suchen darin nach Wörtern, ohne Netz.
- `receipts.matchLine` fragt in dieser Reihenfolge: frühere Quittungen des Haushalts, dann der mitgelieferte Katalog, dann Open Food Facts. Ist der Treffer im Katalog sicher, geht kein Produktname mehr ins Netz. Die Quelle heisst dann `catalog`; die App nennt sie wie Open Food Facts, weil die Daten von dort stammen (ODbL, Namensnennung).
- Die App lädt die Datei (etwa 90 kB gepackt) erst bei der ersten Quittung, der Service Worker hält sie danach offline bereit (`StaleWhileRevalidate`).
- `retail-ch.json` (Aldi, ohne Barcodes) nutzt die App noch nicht. Ein Treffer ohne Barcode braucht eine Änderung der Schnittstelle (`gtin` optional) und kommt mit der Suche beim Erfassen.

## Alte Artikel neu einordnen

Alban (8.11.2026): «Mache alles selber frisch upgedatet.» Artikel, die früher in «Sonstiges» gelandet sind, ordnet `inventory.recategorize` bei jedem Start der App neu ein, sobald die Erkennung sie kennt. Mit der Kategorie wechseln ihr Ort und das geschätzte Datum. Angefasst wird nur, was niemand geändert hat: noch «Sonstiges», Datum noch geschätzt, Ort noch der Vorrat. Jede Änderung läuft als `inventory.updateItem` mit eigenem Ereignis.

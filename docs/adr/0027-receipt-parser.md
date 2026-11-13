# ADR-0027: Bon lesen – Preise aus dem Kassenzettel

- **Status:** angenommen
- **Datum:** 2026-11-07

## Kontext

Alban (7.11.2026): Preise sollen mit dem Bon oder mit Referenzpreisen von Coop, Migros, Aldi, Lidl und Denner abgeglichen werden, mit Datum. Die Preislogik soll höchste Qualität haben.

Die Händler bieten keine offene Preis-Schnittstelle. Ihre Websites automatisch auszulesen verbieten die Nutzungsbedingungen, und CLAUDE.md schliesst echte Händler-Anbindungen aus. Der Bon dagegen zeigt den echten bezahlten Preis mit Aktion, Datum und Laden. Er gehört der Person, die eingekauft hat.

## Entscheid

- **Der Bon ist die Preisquelle.** Schritt 4 des Plans beginnt mit einem allgemeinen Leser in `packages/core` (`parseReceiptText`). Er ist reines TypeScript und arbeitet auf OCR-Text.
- **Was er erkennt:**
  - Händler: Coop, Migros, Aldi, Lidl, Denner, sonst «andere». `RetailerSchema` ist dafür erweitert.
  - Laden, Datum und Uhrzeit.
  - Artikel mit Menge und Stückpreis («2x 4.20»), Gewichtsartikel («0.734 kg x 2.90»), MWST-Codes am Zeilenende.
- **Layouts echter Bons (Coop- und Migros-PDF, 7.11.2026):** Spalte «Aktion» (Coop) und «Gespart» (Migros), Mengen wie «2.0», gewogene Packungen («0.307» kg Pouletbrust zum Packungspreis), MWST-Gruppen wie «0 A» oder «S1». Die MWST-Tabelle unter dem Total gibt eine erste Einschätzung, was Lebensmittel sind: Normalsatz (8.1 %) ist sicher kein Lebensmittel (Shampoo, Taschen). Der reduzierte Satz (2.6 %) gilt aber auch für Tierfutter, Medikamente und Periodenprodukte (Lidl-Bon vom 29.10.2026: Carefree mit Satz A). Die Review und das Kategorie-Matching (4d) korrigieren das.
- **Lidl (App-Bon):** Menge («4 x 0.79») oder Gewicht («0.984 kg x 1.99 CHF/kg») steht unter dem Artikel und muss zu dessen Betrag passen. «Lidl Plus Rabatt» gehört zum Artikel darüber, das Total heisst «Dein Lidl Preis», MWST-Codes A und B.
- **Rabatte und Nebenposten:**
  - Rabatte direkt unter einem Artikel gehören zu diesem Artikel.
  - Rabatte nach der Zwischensumme oder auf den ganzen Einkauf («Einkaufsrabatt») bleiben eigene Zeilen.
  - Pfand und Tragtaschen sind eigene Arten.
- **Summenprüfung:** Die Zeilen müssen auf den Rappen das gedruckte Total ergeben. Sonst meldet der Leser `mismatch`, und die Review zeigt es an. Ein falsch gelesener Betrag fällt so auf, statt still gespeichert zu werden.
- **Lesefehler und Testbons:** OCR-Verwechslungen werden nur in Beträgen korrigiert (`l.95` → `1.95`; «1.5l» bleibt ein Liter). Testbons sind erfunden; echte Bons kommen nie ins Repo.
- **Danach:** Händler-Leser für Coop und Migros mit echten Beispielen, OCR auf dem Gerät (Schritt 5), Review, Preisgedächtnis pro Produkt.

## Konsequenzen

- Preise kommen mit Datum und Laden aus dem echten Einkauf, ohne Konto, Schlüssel oder Server. Die Genauigkeit für Coop und Migros hängt von echten Beispielen ab (Frage 7 im Plan).
- Referenzpreise anderer Läden bleiben eine Option über Open Prices, nur mit Albans OK, weil dabei der Barcode das Gerät verlässt.

## Ergänzung 13.11.2026: Lesefehler auf App-Screenshots

Ein Screenshot einer Lidl-Plus-Quittung (aus der App geteilt, nur gut 200 Pixel breit) ergab 58 richtige Artikel, aber CHF 1.28 Differenz zur Summe. Die Texterkennung las das Minus vor «Lidl Plus Rabatt» oft als «„», «‚» oder «~» und machte aus «1.85» ein «1.985».

- Ein solches Zeichen direkt vor einem Betrag gilt als Minus (`normalizeReceiptLine`), sonst nirgends: «Kaffee „Crema“» bleibt, wie es ist.
- Ein Betrag mit drei Stellen nach dem Punkt vor einem MWST-Code («1.988 A») wird nicht mehr verworfen. Rettich prüft die Lesarten mit je einer Ziffer weniger und nimmt die, mit der die Quittung auf den Rappen aufgeht. Gibt es mehrere solche Zeilen oder passt keine Lesart, bleibt die erste, und die Summenprüfung zeigt die Stelle.
- Dasselbe gilt für den Kilopreis unter gewogener Ware («0,504 kg x 12.980 CHF/kg»).

Die echte Quittung bleibt ausserhalb des Repos; der Test nutzt erfundene Artikel mit denselben Lesefehlern.

## Ergänzung 14.11.2026: Total und verwechselte Ziffern

Zwei weitere Lidl-Plus-Screenshots, beide nur gut 300 Pixel breit. Der erste ergab 41 richtige Artikel, aber CHF 18.00 Differenz. Die Texterkennung las das Total mit einer Ziffer zu viel («Dein Lidl Preis 1099.80» statt 109.80), zweimal «9.99» statt 0.99, und den MWST-Code «B» als «8».

- **Total:** Zeilen unter dem Total wiederholen es («Karte 109.80», «Total-EFT CHF: 109.80»). Weicht das gedruckte Total von so einer Wiederholung nur um eine Ziffer ab (eine mehr, eine weniger, eine andere) und passt die Wiederholung besser zur Summe der Zeilen, gilt die Wiederholung. Bargeld («Bar 120.00») zählt nicht, weil es mehr sein kann.
- **Verwechselte Ziffern:** Geht die Quittung danach nicht auf, probiert Rettich an höchstens zwei Preisen eine typische Verwechslung (0 und 9, 0 und 8, 3 und 8, 5 und 6, 1 und 7). Er korrigiert nur, wenn genau eine solche Kombination die Quittung auf den Rappen aufgehen lässt; sonst zeigt die Summenprüfung die Differenz. Zeilen mit Menge («4 x 0.79») bleiben, wie sie sind, weil die Menge ihren Preis schon prüft.
- **Nur bei Fotos:** Text aus einem PDF hat keine Lesefehler. Dort rät Rettich nie (`parseReceiptText(text, { fromPdf: true })`), eine Differenz bleibt sichtbar.
- **MWST-Code:** Fehlt der Code «8» in der MWST-Tabelle, aber «B» steht dort, gilt «8» als «B».
- **Gewogene Ware:** Passen Gewicht × Kilopreis und Betrag nicht zusammen («9.578 kg x 1.19» unter «Bananen 9.69»), probiert Rettich verwechselte Ziffern in Gewicht und Betrag. Passt genau ein Paar (0.578 kg, 0.69), gilt es.
- **Rundung:** Eine «Rundung» ist nie ein Artikel und immer unter 10 Rappen, ob plus oder minus. Aus «-9.03» wird -0.03, wenn genau eine verwechselte Ziffer dorthin führt.
- **Doppelpunkt:** «Popkorn 1:25 A» ist ein Betrag. Ohne diese Regel fiel der ganze Artikel weg. Uhrzeiten enden nie auf einen MWST-Code und bleiben, wie sie sind.

- **Filiale:** Steht «Einkauf getätigt in» auf dem Screenshot, ist die Zeile darunter die Filiale (ohne «(Fil.Nr. …)»). Oben auf einer Lidl-Quittung steht nur das Logo, das die Texterkennung als Wort liest; daraus nimmt Rettich keine Filiale mehr.

Der zweite Screenshot (58 Artikel) brachte gewogene Ware, eine Rundung und einen Doppelpunkt (die drei Punkte darüber) und zeigt die Grenze: Zwei Fehler, die sich gegenseitig verdecken (9.69 statt 0.69, 0.25 statt 1.25), lassen mehrere Erklärungen zu. Rettich rät dort nicht. Die Summenprüfung zeigt CHF 8.00 Differenz, und die Person korrigiert die zwei Zeilen im Durchgehen.

Die echten Quittungen bleiben ausserhalb des Repos; die Tests nutzen erfundene Artikel mit denselben Lesefehlern.

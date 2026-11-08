# Changelog

Alle Änderungen an FridgeAI, neueste zuerst. Wird mit `pnpm release` erzeugt (ADR-0017).

## [0.9.0] – 2026-11-08

**Berichte wie ein Kontoauszug, Kurz-Berichte als Quittung, und Rettich mit grossem R.**
- **Berichtsarten:** Kurz-Berichte als Quittung: Wirkung, Läuft bald ab (1, 3, 7 oder eigene Tage), Weggeworfen, Kühlschrank, Tiefkühler, Vorrat. Der ausführliche Bericht zeigt keine Quittung.
- **Schwarze Karte mit Ring:** Der ausführliche Bericht beginnt wieder mit der Onyx-Karte, der Rettungsquote als Ring und drei Kacheln.
- **Zeiträume wie ein Kontoauszug:** Monats- oder Jahresabschluss am letzten Schweizer Bankwerktag oder frei von–bis, immer als TT.MM.JJJJ.
- **Sprache und Marke:** «Quittung» statt «Bon», «Abfall» statt «Kübel», «Rettich» mit grossem R. Der Claim lautet «Wirf kein Geld in den Abfall.».
- **Stabilere Tests:** Die Barrierefreiheits-Prüfung wartet, bis Animationen fertig sind.

### Neu

- periods like a bank statement – closings on the last Swiss bank day, or any range ([#175](https://github.com/BanioX/FridgeAI/pull/175))
- bring back the onyx card with the rescue ring in the detailed report ([#174](https://github.com/BanioX/FridgeAI/pull/174))
- report kinds – quick receipts and a detailed report without one ([#173](https://github.com/BanioX/FridgeAI/pull/173))
- «Abfall» instead of «Kübel», the claim is «Wirf kein Geld in den Abfall.» ([#172](https://github.com/BanioX/FridgeAI/pull/172))
- the brand is «Rettich» with a capital R ([#170](https://github.com/BanioX/FridgeAI/pull/170))
- page 1 of the PDF as a Rettich receipt ([#168](https://github.com/BanioX/FridgeAI/pull/168))
- «Quittung» instead of «Bon», with a note on shop names ([#167](https://github.com/BanioX/FridgeAI/pull/167))
- the PDF report in the app's design language ([#165](https://github.com/BanioX/FridgeAI/pull/165))

### Dokumentation

- update the handover after #170 ([#171](https://github.com/BanioX/FridgeAI/pull/171))
- a handover note for the next session ([#169](https://github.com/BanioX/FridgeAI/pull/169))
- StreamUp funding and the name-and-vision question ([#166](https://github.com/BanioX/FridgeAI/pull/166))

## [0.8.0] – 2026-11-07

**Eins wegwischen, die Quittung gleicht sich selbst ab, und weniger Schulden.**
- **Wischen zum Essen:** Wisch einen Artikel nach links, und eins ist gegessen (6 Glace → 5), mit «Rückgängig». Der Streifen steht immer mittig, Text wird nie angeschnitten.
- **Quittung und Open Food Facts:** Der Abgleich startet von selbst. Du sagst pro Artikel «Ist es das? Ja/Nein» und scannst bei Bedarf den Barcode.
- **Nährwerte aus einem Foto oder Screenshot** der Packung, gelesen auf dem Gerät.
- **Scanner mit Licht:** Wo der Browser die Lampe nicht schalten kann, öffnet sich die Kamera-App mit Blitz.
- **Erfassen einfacher:** grosse Kacheln, Name und Datum zuerst. «Mit eigener KI» ist weg.
- **Logo auf Smaragd** und eine Grundlage für jede Währung (CHF bleibt Standard).
- **Weniger Schulden:** Inventar, häufige Produkte, Preis-Gedächtnis und Berichte liegen in der Logikschicht. Neu gibt es Register für Nebenwirkungen, Lektionen, Schulden und Begriffe (SWELP).

### Neu

- swipe a row left to eat one portion ([#160](https://github.com/BanioX/FridgeAI/pull/160))
- simpler Erfassen – big tiles, name and date first, no «Mit eigener KI» ([#158](https://github.com/BanioX/FridgeAI/pull/158))
- read nutrition from a photo or screenshot of the label ([#157](https://github.com/BanioX/FridgeAI/pull/157))
- scanner light always there, camera app with flash where the browser cannot switch it ([#155](https://github.com/BanioX/FridgeAI/pull/155))
- receipt matching v2 – automatic, «Ist es das?» Ja/Nein, barcode per line ([#154](https://github.com/BanioX/FridgeAI/pull/154))
- currency foundation – household currency and formatMoney ([#152](https://github.com/BanioX/FridgeAI/pull/152))
- logo on Smaragd (Alban's choice A) ([#151](https://github.com/BanioX/FridgeAI/pull/151))

### Dokumentation

- what rettich learns from the YAZIO analysis ([#163](https://github.com/BanioX/FridgeAI/pull/163))
- park allergens, spaces, uneven discipline and self-capturing labels ([#162](https://github.com/BanioX/FridgeAI/pull/162))
- add SWELP registers for side effects, lessons, debts and terms ([#159](https://github.com/BanioX/FridgeAI/pull/159))
- Parkplatz for big levers that need clarification, with a business model draft ([#156](https://github.com/BanioX/FridgeAI/pull/156))

### Wartung

- move usual products, price memory and report into core ([#161](https://github.com/BanioX/FridgeAI/pull/161))
- move inventory use cases and household export behind storage ports ([#153](https://github.com/BanioX/FridgeAI/pull/153))

## [0.7.0] – 2026-11-07

**Schlanker, premium, und der Bon kennt Open Food Facts.**
- **Premium-Look:** drei Töne statt fünf Grüns. Smaragd für Aktionen, Silber als Grund, Onyx für die Wert-Karte und den ＋-Knopf (ADR-0035).
- **Schlanker:**
  - Start zeigt nur, was heute wichtig ist.
  - Erfassen fragt nur Name, Datum und Menge, der Rest steht unter «Mehr Angaben».
  - Kochen ist eine Liste mit «Retten · Feierabend · Alle».
  - Mehr hat einen Bericht und den Export als JSON.
- **Bon mit Open Food Facts:** Ein Tipp gleicht die Zeilen ab, raus gehen nur die Produktnamen. Du bestätigst jeden Treffer mit «Passt», danach erkennt rettich die Zeile beim nächsten Bon ohne Netz (ADR-0036).
- **Bereit für ein Backend:** drei Schichten (Präsentation, Logik, Daten), Speicher-Ports und die ersten Anwendungsfälle in der Logikschicht (ADR-0034).
- **Behoben:** Die Seite Erfassen liess sich seitlich verschieben.

### Neu

- «Mit Open Food Facts abgleichen» on the receipt review ([#149](https://github.com/BanioX/FridgeAI/pull/149))
- match receipt lines with Open Food Facts ([#148](https://github.com/BanioX/FridgeAI/pull/148))
- premium palette – Smaragd, Silber, Onyx ([#147](https://github.com/BanioX/FridgeAI/pull/147))
- modern surfaces – calm neutral ground, borderless cards, one segmented style ([#145](https://github.com/BanioX/FridgeAI/pull/145))
- one recipe list on Kochen - Retten, Feierabend, Alle ([#143](https://github.com/BanioX/FridgeAI/pull/143))
- leaner adding – name, date, amount; the rest under «Mehr Angaben» ([#142](https://github.com/BanioX/FridgeAI/pull/142))
- leaner Start – only what needs you today ([#141](https://github.com/BanioX/FridgeAI/pull/141))
- leaner Mehr – one report, JSON only, no developer label ([#140](https://github.com/BanioX/FridgeAI/pull/140))

### Behoben

- no sideways scrolling on Erfassen – the quick-add row keeps its chips inside ([#139](https://github.com/BanioX/FridgeAI/pull/139))

### Dokumentation

- three layers – presentation, logic, data (ADR-0034), enforced by ESLint ([#144](https://github.com/BanioX/FridgeAI/pull/144))
- README, plan and pilot guide on the state of v0.6.0; releases titled «rettich» ([#138](https://github.com/BanioX/FridgeAI/pull/138))

### Wartung

- storage ports and the first use cases in the logic layer ([#146](https://github.com/BanioX/FridgeAI/pull/146))

## [0.6.0] – 2026-11-07

**rettich: Wirf kein Geld in den Kübel.** Die App heisst jetzt rettich, klein geschrieben wie «rett' ich», mit dem aufrechten weissen Rettich als Symbol und fünf Grüntönen aus dem Garten (Broccoli, Rucola, Basilikum, Kopfsalat, Eisberg).
- **Navigation:** Unten gibt es fünf Tabs (Start, Vorrat, ＋ Erfassen, Kochen, Mehr).
- **Kochen:** «Rette heute», «Alle Rezepte» und ein Feierabend-Filter (höchstens 15 Minuten, nichts einkaufen).
- **Ehrliche Zahlen:** «Gerettet» zählt nur noch, was kurz vor Ablauf gegessen oder weitergegeben wurde.
- **Korrigieren:** Im Verlauf lassen sich falsche Einträge ändern oder löschen.
- **Berichte:** PDF-Berichte zu Kühlschrank, Wirkung und Einkäufen öffnen sich direkt in der App.
- **Bon:** Eine Preis-Erinnerung zeigt «12 % teurer als sonst».
- **Artikelseite:** Sie zeigt «Weitere Packungen» desselben Produkts und welche zuerst weg muss.
- **Daten mitnehmen:** «Daten importieren» holt einen Export zurück, etwa auf ein neues Gerät oder später nach rettich.app.

### Neu

- the PDF report opens inside the app, «Teilen» top right ([#129](https://github.com/BanioX/FridgeAI/pull/129))
- «Daten importieren» – bring an export back under «Daten und Datenschutz» ([#134](https://github.com/BanioX/FridgeAI/pull/134))
- «Weitere Packungen» – other packs of the same product on the item page ([#135](https://github.com/BanioX/FridgeAI/pull/135))
- «Feierabend» filter on Kochen – at most 15 minutes, nothing to buy ([#128](https://github.com/BanioX/FridgeAI/pull/128))
- «rettich», always lowercase – rett' ich, not the vegetable ([#126](https://github.com/BanioX/FridgeAI/pull/126))
- «Ändern» in Verlauf – correct eaten, shared or wasted afterwards ([#124](https://github.com/BanioX/FridgeAI/pull/124))
- five garden greens – Broccoli, Rucola, Basilikum, Kopfsalat, Eisberg ([#132](https://github.com/BanioX/FridgeAI/pull/132))
- household.import – bring a JSON export back, replacing what is on the device ([#133](https://github.com/BanioX/FridgeAI/pull/133))
- «Radish Pop» app icon – tilted radish, check leaf, deep green ([#127](https://github.com/BanioX/FridgeAI/pull/127))
- «gerettet» means eaten or shared shortly before expiry (ADR-0033) ([#125](https://github.com/BanioX/FridgeAI/pull/125))
- inventory.changeOutcome – correct eaten, shared or wasted afterwards ([#123](https://github.com/BanioX/FridgeAI/pull/123))
- «Verlauf» – see and delete eaten or wasted entries ([#122](https://github.com/BanioX/FridgeAI/pull/122))
- inventory.history – what was eaten, shared or wasted, to correct it ([#121](https://github.com/BanioX/FridgeAI/pull/121))
- the app is called «Rettich» – name, icon and docs (ADR-0032) ([#120](https://github.com/BanioX/FridgeAI/pull/120))
- «Alle Rezepte» on Kochen – recipes.list, what works with your food first ([#119](https://github.com/BanioX/FridgeAI/pull/119))
- five tabs – «Kochen» next to ＋ in the middle (ADR-0031) ([#118](https://github.com/BanioX/FridgeAI/pull/118))
- «Nachkaufen» with one tap once an item is used up or gone (ADR-0031) ([#116](https://github.com/BanioX/FridgeAI/pull/116))
- «Erfassen» – every way to add food as one menu (ADR-0031) ([#115](https://github.com/BanioX/FridgeAI/pull/115))
- «Berichte als PDF» under «Mehr» – choose, create, share (ADR-0030) ([#113](https://github.com/BanioX/FridgeAI/pull/113))
- the PDF report itself – jsPDF on the device (ADR-0030) ([#112](https://github.com/BanioX/FridgeAI/pull/112))
- four tabs – Start, Vorrat, ＋ Erfassen, Mehr (ADR-0031) ([#114](https://github.com/BanioX/FridgeAI/pull/114))
- «Was auffällt» – report insights and texts (ADR-0030) ([#111](https://github.com/BanioX/FridgeAI/pull/111))
- reports.build – the report query on the device (contract, ADR-0030) ([#110](https://github.com/BanioX/FridgeAI/pull/110))
- report data – fridge now, saved and wasted per month, why, spending (ADR-0030) ([#109](https://github.com/BanioX/FridgeAI/pull/109))
- price memory on the item page and the add form (ADR-0029) ([#107](https://github.com/BanioX/FridgeAI/pull/107))
- «12 % teurer als sonst» on the receipt – prices.memory (ADR-0029) ([#106](https://github.com/BanioX/FridgeAI/pull/106))
- price memory – last paid, usual price, cheapest shop (ADR-0029) ([#105](https://github.com/BanioX/FridgeAI/pull/105))

### Behoben

- back to the first app icon – upright white radish on app green ([#131](https://github.com/BanioX/FridgeAI/pull/131))
- receipt products land in the right place – receipt words, pet food ([#108](https://github.com/BanioX/FridgeAI/pull/108))

### Dokumentation

- integrations, copy protection, garden design language, market and timing ([#136](https://github.com/BanioX/FridgeAI/pull/136))
- four tabs (ADR-0031), «Schnittstelle» instead of «Vertrag», app store estimate ([#117](https://github.com/BanioX/FridgeAI/pull/117))

### Wartung

- skip the heavy steps when only docs change ([#130](https://github.com/BanioX/FridgeAI/pull/130))

## [0.5.0] – 2026-11-07

**Bon hochladen, Preise kennen.** Kassenbon als PDF (Coop, Migros), Screenshot (Lidl Plus) oder Foto hochladen: FridgeAI liest ihn auf dem Gerät, zeigt jeden Artikel mit bezahltem Preis und Aktion, prüft die Summe auf den Rappen, ein falsch gelesener Preis lässt sich antippen und korrigieren, Lebensmittel kommen mit echtem Preis in den Vorrat. Dazu Produktsuche beim Tippen wie bei Yazio mit «Bereits verwendet», die Kategorie nur noch im Hintergrund und ein Kalender, der auf dem iPhone aufgeht.

### Neu

- correct a misread price on the receipt with a tap ([#103](https://github.com/BanioX/FridgeAI/pull/103))
- read receipt photos and screenshots on the device (tesseract.js) ([#102](https://github.com/BanioX/FridgeAI/pull/102))
- upload a receipt PDF – names and prices, food into the inventory (ADR-0028) ([#101](https://github.com/BanioX/FridgeAI/pull/101))
- read receipt PDFs on the device – pdf.js, lines rebuilt from columns ([#100](https://github.com/BanioX/FridgeAI/pull/100))
- receipts.import – store a read receipt, chosen items with the price paid (ADR-0028) ([#99](https://github.com/BanioX/FridgeAI/pull/99))
- read Lidl receipts – quantity and «Lidl Plus Rabatt» below the item ([#98](https://github.com/BanioX/FridgeAI/pull/98))
- receipt layouts of real Coop and Migros PDFs, food by VAT rate ([#97](https://github.com/BanioX/FridgeAI/pull/97))
- read receipts – items, weights, discounts and sum check (ADR-0027) ([#96](https://github.com/BanioX/FridgeAI/pull/96))
- category only in the background, under «Mehr Angaben» (ADR-0026) ([#95](https://github.com/BanioX/FridgeAI/pull/95))
- search while typing, like Yazio (ADR-0025) ([#94](https://github.com/BanioX/FridgeAI/pull/94))
- search products by name – «Bereits verwendet» while typing, Open Food Facts on tap (ADR-0024) ([#93](https://github.com/BanioX/FridgeAI/pull/93))
- products.search – find products by name, household first, then Open Food Facts CH (contract) ([#92](https://github.com/BanioX/FridgeAI/pull/92))

### Behoben

- calendar opens on iPhone – the real date field lies on the calendar symbol ([#91](https://github.com/BanioX/FridgeAI/pull/91))

### Dokumentation

- privacy notice in plain words (draft, plan 12d) ([#90](https://github.com/BanioX/FridgeAI/pull/90))

## [0.4.0] – 2026-11-06

**Kühlschrank aktuell halten und Gefährdetes verkochen.** Wöchentlicher 30-Sekunden-Kühlschrank-Check (noch da, halb, gegessen, weggeworfen); «Schnell erfassen» mit den eigenen Standardartikeln in einem Tipp; Rezeptideen auf «Heute» aus dem, was bald abläuft, mit 25 selbst geschriebenen Schweizer Rezepten, Fehlendem auf die Einkaufsliste und Abbuchen nach dem Kochen; Listen und Auswahl im Apple-Stil; auf kleinen Handys bleibt der Artikelname lesbar.

### Neu

- book what was cooked – «Alles · Halb · Nichts» per food on the recipe page (R-03, ADR-0023) ([#88](https://github.com/BanioX/FridgeAI/pull/88))
- eleven Swiss classics and sweet rescues (11b, data 2/2) ([#86](https://github.com/BanioX/FridgeAI/pull/86))
- nine more recipes for fridge leftovers (11b, data 1/2) ([#85](https://github.com/BanioX/FridgeAI/pull/85))
- «Rezeptideen» on Heute and a recipe page with missing items to the list (11c) ([#84](https://github.com/BanioX/FridgeAI/pull/84))
- recipes.suggest and recipes.get on the device (11b/11c, contract) ([#83](https://github.com/BanioX/FridgeAI/pull/83))
- recipes that rescue soon-expiring food – schema, ranking, first recipes (11b) ([#82](https://github.com/BanioX/FridgeAI/pull/82))
- «Schnell erfassen» – usual products with one tap and undo (UC-07) ([#81](https://github.com/BanioX/FridgeAI/pull/81))
- products.frequent – the household's usual products with last amount (UC-07, contract) ([#80](https://github.com/BanioX/FridgeAI/pull/80))
- 30-second fridge check – still there, half, eaten or thrown away (UC-04) ([#79](https://github.com/BanioX/FridgeAI/pull/79))
- fridge check logic – halfOf, queue, weekly due and last check (UC-04, ADR-0022) ([#78](https://github.com/BanioX/FridgeAI/pull/78))
- inset grouped lists for Heute, Vorrat and Einkaufsliste (ADR-0021) ([#76](https://github.com/BanioX/FridgeAI/pull/76))
- Apple segmented control for places, outcomes and date kinds (ADR-0021) ([#75](https://github.com/BanioX/FridgeAI/pull/75))

### Behoben

- readable item names on narrow phones – status chip under the name below 360 px ([#87](https://github.com/BanioX/FridgeAI/pull/87))

### Dokumentation

- ideas for design (swipe, sheets, dark mode, narrow phones) and operations ([#77](https://github.com/BanioX/FridgeAI/pull/77))

## [0.3.0] – 2026-11-06

**Bereit für den Pilot.** Einkaufsliste mit «Du hast noch …»; Packungsbilder von Open Food Facts in Listen und Detailansicht, auf dem Gerät gemerkt; schärferer Barcode-Scan (Hauptkamera, Zoom, Rahmen, Foto aus der Galerie); Artikel bearbeiten (auch Name, Kategorie und Ort) und löschen mit Rückgängig; «Haushalt» mit Installationshinweis, Export als JSON oder CSV, «Alles löschen» und Datenschutz in klaren Worten; Apple-Schrift und grosse Titel; App-Icons; der Browser wird gebeten, die Daten zu behalten. Nach einem Update lädt die App einmal neu statt einen Fehler zu zeigen, und die feste Adresse enthält keine Demo-Daten mehr.

### Neu

- «Bearbeiten» with name, category and place; «Artikel löschen» with undo ([#73](https://github.com/BanioX/FridgeAI/pull/73))
- delete a wrong item and correct name, category and place (contract) ([#72](https://github.com/BanioX/FridgeAI/pull/72))
- ask the browser to keep the local data (persistent storage) ([#68](https://github.com/BanioX/FridgeAI/pull/68))
- home screen icons for iPhone and Android ([#67](https://github.com/BanioX/FridgeAI/pull/67))
- Apple typography – system font, large titles, no brand bar (ADR-0021) ([#66](https://github.com/BanioX/FridgeAI/pull/66))
- «Haushalt» – install hint, export JSON/CSV, delete everything, privacy (12a) ([#65](https://github.com/BanioX/FridgeAI/pull/65))
- export and delete all household data on the device (12a, ADR-0020) ([#64](https://github.com/BanioX/FridgeAI/pull/64))
- pack pictures in the lists and on the detail page (10b) ([#63](https://github.com/BanioX/FridgeAI/pull/63))
- keep the pack picture from Open Food Facts on the device (10b, data) ([#62](https://github.com/BanioX/FridgeAI/pull/62))
- «Einkaufsliste» – add, hint at food at home, check off, into the inventory (11a) ([#59](https://github.com/BanioX/FridgeAI/pull/59))
- shopping list on the device – add, check off, remove, «Du hast noch …» (11a) ([#57](https://github.com/BanioX/FridgeAI/pull/57))

### Behoben

- main on Cloudflare without demo data and styleguide, previews keep them ([#69](https://github.com/BanioX/FridgeAI/pull/69))
- reload once into the new version instead of «Unexpected Application Error» ([#71](https://github.com/BanioX/FridgeAI/pull/71))
- sharper barcode scans – main lens, 1920×1080, 2× zoom, frame, gallery photos ([#60](https://github.com/BanioX/FridgeAI/pull/60))

### Dokumentation

- pilot guide and README for the pilot ([#70](https://github.com/BanioX/FridgeAI/pull/70))
- ideas folder, product priorities and ADRs for currencies, data retention and Apple design ([#61](https://github.com/BanioX/FridgeAI/pull/61))

## [0.2.0] – 2026-11-06

**Korrigieren, verstehen, wiederfinden.** Rückgängig nach Gegessen, Weitergegeben oder Weggeworfen; Datum, Menge und Preis nachträglich ändern; «Deine Wirkung diesen Monat» auf der Startseite; Nährwerte, Nutri-Score und Allergene nach dem Scan (30 Tage offline gemerkt); Zahlen mit Dezimalpunkt wie bei Franken und Reste als Bruch («¾ Stk.»).

### Neu

- product facts on the detail page – brand, nutrition, Nutri-Score, allergens (10b) ([#55](https://github.com/BanioX/FridgeAI/pull/55))
- remember Open Food Facts answers and keep the facts on the product (10b) ([#54](https://github.com/BanioX/FridgeAI/pull/54))
- «Datum, Menge oder Preis ändern» – edit an item ([#53](https://github.com/BanioX/FridgeAI/pull/53))
- inventory.updateItem – correct date, date kind, quantity or price (contract) ([#52](https://github.com/BanioX/FridgeAI/pull/52))
- «Rückgängig» after eaten, shared or wasted ([#50](https://github.com/BanioX/FridgeAI/pull/50))
- inventory.undoOutcome – give eaten, shared or wasted food back (contract) ([#49](https://github.com/BanioX/FridgeAI/pull/49))
- «Deine Wirkung diesen Monat» on the start page (stats.waste, step 6) ([#46](https://github.com/BanioX/FridgeAI/pull/46))

### Behoben

- Swiss decimal point and readable piece fractions in quantities (ADR-0018) ([#47](https://github.com/BanioX/FridgeAI/pull/47))

### Tests

- wait for the lazy Vorrat page instead of any heading ([#48](https://github.com/BanioX/FridgeAI/pull/48))

### Wartung

- command kit for local handlers (transaction, idempotency, events) ([#56](https://github.com/BanioX/FridgeAI/pull/56))
- one quantity formatter for all pages (ui/quantity-text) ([#51](https://github.com/BanioX/FridgeAI/pull/51))

## [0.1.0] – 2026-11-06

**Erstes Release: der manuelle Prototyp.** Erfassen von Hand, per Barcode (mit Produktdaten von Open Food Facts) oder mit deiner eigenen KI; «Heute retten», Vorrat mit Notvorrat, Detailansicht mit Gegessen, Weitergegeben und Weggeworfen in sinnvollen Portionen, Öffnungsregel, Einfrieren. Läuft offline als PWA, Vorschau-Links für jeden PR.

### Neu

- a scan fills in name, category and pack size (household first, then Open Food Facts) ([#42](https://github.com/BanioX/FridgeAI/pull/42))
- products.lookup – household first, then Open Food Facts (ADR-0016) ([#40](https://github.com/BanioX/FridgeAI/pull/40))
- barcode and QR scanning – camera, photo or typed number (step 10a, ADR-0014) ([#38](https://github.com/BanioX/FridgeAI/pull/38))
- «Scannen» with your own AI – copy prompt, paste answer, review, take over ([#37](https://github.com/BanioX/FridgeAI/pull/37))
- AI import – prompt and strict parser for the user's own AI (ADR-0012, step 5b) ([#36](https://github.com/BanioX/FridgeAI/pull/36))
- item detail with eaten / thrown away / given away, opening and freezing (step 6) ([#34](https://github.com/BanioX/FridgeAI/pull/34))
- building blocks for item actions (choice chips, portion labels, texts) ([#33](https://github.com/BanioX/FridgeAI/pull/33))
- «Artikel erfassen» form (step 3d) ([#32](https://github.com/BanioX/FridgeAI/pull/32))
- add-item helpers and texts (amount parsing, suggestions) ([#31](https://github.com/BanioX/FridgeAI/pull/31))
- inventory.open, packaging on add, reasons and recipients on outcomes ([#30](https://github.com/BanioX/FridgeAI/pull/30))
- category-aware portions (thirds, quarters, eighths, egg packs, pieces) ([#28](https://github.com/BanioX/FridgeAI/pull/28))
- everyday quantities, portions, after-opening rule, waste reasons ([#25](https://github.com/BanioX/FridgeAI/pull/25))
- «Heute retten» start page and Vorrat page with four tabs ([#24](https://github.com/BanioX/FridgeAI/pull/24))
- inventory operations of contract v1 on IndexedDB ([#22](https://github.com/BanioX/FridgeAI/pull/22))
- local IndexedDB storage, local household bootstrap, name matching ([#21](https://github.com/BanioX/FridgeAI/pull/21))
- read expiry dates from label text for future label photos ([#20](https://github.com/BanioX/FridgeAI/pull/20))
- contract v1 – commands, queries, domain events, JSON Schema export ([#19](https://github.com/BanioX/FridgeAI/pull/19))
- DateField – quick choices, typing with auto dots, native calendar ([#18](https://github.com/BanioX/FridgeAI/pull/18))
- ports for capturing, product data, recipes, partners, sync and notifications ([#17](https://github.com/BanioX/FridgeAI/pull/17))
- Notvorrat as fourth storage location with decade-long dates ([#16](https://github.com/BanioX/FridgeAI/pull/16))
- read GS1 codes with expiry dates – DataMatrix, Digital Link ([#15](https://github.com/BanioX/FridgeAI/pull/15))
- Swiss dates, expiry status, category catalog and manual date entry ([#14](https://github.com/BanioX/FridgeAI/pull/14))
- domain model schemas incl. expiry source and nutrition ([#13](https://github.com/BanioX/FridgeAI/pull/13))
- Rappen money type, CHF parsing/formatting, allocation and UUIDv7 ([#10](https://github.com/BanioX/FridgeAI/pull/10))
- UI primitives and development-only styleguide ([#8](https://github.com/BanioX/FridgeAI/pull/8))
- green design system with tokens, self-hosted fonts and icons ([#7](https://github.com/BanioX/FridgeAI/pull/7))
- React PWA shell with routing, Tailwind and Playwright smoke test ([#6](https://github.com/BanioX/FridgeAI/pull/6))

### Behoben

- address one person with «du», never «ihr»; record free-tools approval ([#29](https://github.com/BanioX/FridgeAI/pull/29))

### Dokumentation

- README as project guide, proprietary licence, licence check in CI (ADR-0015) ([#39](https://github.com/BanioX/FridgeAI/pull/39))
- office fridge brainstorm (label instead of marker, fair disposal, team plans) ([#35](https://github.com/BanioX/FridgeAI/pull/35))
- bring-your-own-AI for photo recognition (copy/paste import now, MCP later), ADR-0012 ([#26](https://github.com/BanioX/FridgeAI/pull/26))
- architecture and scaling vision, i18n/backend/auth ADRs, new use cases ([#23](https://github.com/BanioX/FridgeAI/pull/23))
- product and nutrition data sources (OFF, Open Food Repo, BLV, YAZIO) ([#11](https://github.com/BanioX/FridgeAI/pull/11))
- MVP plan, brief, strategy summary, use cases and Claude setup ([#1](https://github.com/BanioX/FridgeAI/pull/1))

### Wartung

- release and maintenance rhythm – changelog, tags, GitHub Releases (ADR-0017) ([#41](https://github.com/BanioX/FridgeAI/pull/41))
- Cloudflare preview links for every PR, production headers in E2E, ADR-0013 ([#27](https://github.com/BanioX/FridgeAI/pull/27))
- install Playwright Chromium without apt dependencies ([#12](https://github.com/BanioX/FridgeAI/pull/12))
- preview script for compact phone screenshots ([#9](https://github.com/BanioX/FridgeAI/pull/9))
- PR template, ADR-0002 stack and tooling, documented commands ([#5](https://github.com/BanioX/FridgeAI/pull/5))
- Bump actions/setup-node from 6 to 7 ([#4](https://github.com/BanioX/FridgeAI/pull/4))
- Bump actions/checkout from 6 to 7 ([#3](https://github.com/BanioX/FridgeAI/pull/3))
- pnpm monorepo, strict TypeScript, ESLint, Vitest and CI ([#2](https://github.com/BanioX/FridgeAI/pull/2))
- Initial commit


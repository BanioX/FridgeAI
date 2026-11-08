# Parkplatz: grosse Hebel mit Abklärungsbedarf

Hier parkt alles, was nachweislich einen USP hätte, aber vor dem Bau eine Abklärung braucht: einen Partner, einen Vertrag, Geld, eine Rechtsfrage oder einen neuen Datenfluss. Alban wollte am 7.11.2026 einen festen Ort dafür.

**Regeln**

- Claude führt die Datei bei jedem Gespräch nach, in dem ein solcher Hebel auftaucht (CLAUDE.md, Arbeitsweise Punkt 6).
- **Brainstorming:** Alban darf frei denken. Claude sortiert jede Idee ein (jetzt, später, Parkplatz) und sagt kurz, warum. Was zum aktuellen Stand passt, entscheidet Claude (Alban, 7.11.2026). Was Geld kostet, Daten neu vom Gerät schickt oder das Produkt stark ändert, entscheidet Alban (CLAUDE.md, Punkt 5).
- Ein Eintrag wandert erst in den [Plan](../plan.md), wenn er entschieden ist.
- **Status:** `geparkt` · `in Abklärung` · `entschieden → Plan` · `verworfen` (mit Grund).
- Kleinere Ideen ohne Abklärungsbedarf stehen in den anderen Dateien dieses Ordners ([Übersicht](./README.md)).
- Pitch und Businessplan liegen als Artifacts vor: [Rettich Pitch](https://claude.ai/artifact/GCdjDPAGbtJLmXAoguBBLS), [Rettich Businessplan](https://claude.ai/artifact/LUoSvobGNDrPYsc2453SNd).

## Fokus jetzt: bis zum Pilot

Alban, 7.11.2026: «Jetzt sind wir so weit am Anfang, dass ich mich verzetteln könnte.» Darum baut Claude bis zum Pilot (Alban und eine Person) nur, was den Kühlschrank-Alltag zu zweit trägt:

1. **Quittung lesen und abgleichen:** vier Schritte pro Artikel, «Quittung» statt «Bon» in der App.
2. **Wenig Aufwand im Alltag:** Wischen zum Essen, Kühlschrank-Check, Erinnerungen.
3. **Schulden abbauen** ([`schulden.md`](../schulden.md)), damit Konten und Server später ohne Umbau kommen.

Alles in diesem Parkplatz wartet auf den Pilot und seine Zahlen.

## Übersicht

| # | Hebel | USP: warum gross | Was abzuklären ist | Status |
| --- | --- | --- | --- | --- |
| P1 | **Partnerschaft mit Migros und Coop** (auch Denner, Lidl, Aldi): Produktdaten, Nachkauf mit Provision, digitale Kassenzettel | Kein Abfotografieren mehr, vollständige Produktdaten, Nachkauf in einem Tipp. Daraus entsteht ein Geschäftsmodell (siehe unten) | Pitch, Vertrag, Einwilligung pro Haushalt, Provisionshöhe | geparkt |
| P2 | **Gemeinsames Gedächtnis über alle Haushalte**: Bon-Text → Barcode | Netzwerkeffekt: Ein bestätigter Bon hilft allen. Mit jeder Person wird Rettich besser, das kann niemand kopieren | Konten und Server (P6), Datenschutz: nur die Zuordnung, nie wer was kauft | geparkt |
| P3 | **WG-Funktionen**: wem gehört's, wer schuldet was | Kern der Vision («Scan deinen Bon – Rettich weiss, … wem es gehört, wer was schuldet»). Kein Konkurrent kann das | Konten, Sync, Einladungen, Abrechnung (P6). «Wer hat's gegessen» (wer im Haushalt wischt) gehört zu den WG-Funktionen. | geparkt |
| P4 | **Open Food Repo der EPFL** als zweite Produktquelle | Stark bei Schweizer Eigenmarken, also genau der Lücke von Open Food Facts | Lebt die API noch? Lizenz, Schlüssel über einen Gratis-Proxy, neuer Datenfluss | geparkt |
| P5 | **Beitragen an Open Food Facts** (Fotos, Nährwerte) | Unbekannte Produkte werden für alle bekannt; Rettich als guter Bürger der offenen Daten | Konto der Person bei Open Food Facts, neuer Datenfluss | geparkt |
| P6 | **Backend und Konten** (Hono, PostgreSQL) | Voraussetzung für P2, P3, Sync zwischen Handys, echte Push-Mitteilungen | Hosting-Kosten, Datenschutz (ADR-0020), Betrieb. Die drei Schichten sind vorbereitet (ADR-0034) | geparkt |
| P7 | **App Store über Capacitor** | Echte App-Symbole, Push, Taschenlampe auch auf dem iPhone, Hintergrund-Erinnerungen, Vertrauen | Kosten: Apple USD 99 pro Jahr, Google USD 25 einmal; Review-Prozess ([`app-stores.md`](./app-stores.md)) | geparkt |
| P8 | **Marke und Domain**: rettich.app, Marke Schweiz und EU | Schutz vor Kopien, bevor das Marketing startet | CHF 350 (Schweiz), EUR 900–1050 (EU). «Rettermarkt Rettich» in Saarbrücken prüfen ([`schutz.md`](./schutz.md)) | geparkt (Alban) |
| P9 | **Start in Deutschland und Österreich** | Zehnfacher Markt. Die Währungs-Grundlage ist gebaut (ADR-0019) | Bon-Parser für Rewe, Edeka, Spar, Billa usw., Schätzpreise pro Land, Befehl zum Umstellen der Währung | geparkt |
| P10 | **GS1-2D-Codes** («Sunrise 2027») mit GS1 Schweiz | Ablaufdatum direkt aus dem Code, ohne Tippen. Rettich liest sie schon heute | Pilotpartner, Zeitplan der Händler ([`integrationen.md`](./integrationen.md)) | geparkt |
| P11 | **Thermomix/Cookidoo, Samsung Food** und eine **offene Rettich-Schnittstelle** (OpenAPI, MCP) | Rettich als Schicht zwischen Einkauf und Küche | Ob die Importe funktionieren, Partnergespräche, Einwilligung ([`integrationen.md`](./integrationen.md)) | geparkt |
| P12 | **Kühlschrank-Hersteller** (LG, Samsung) und EU Data Act | Langfristig Daten direkt vom Gerät | Kein Hersteller öffnet heute sein Inventar ([`integrationen.md`](./integrationen.md)) | geparkt |
| P13 | **Preisvergleich zwischen Läden** («bei Coop 30 Rappen günstiger») | Spart Geld, nicht nur Lebensmittel | Preisdaten der Händler (P1) oder Preise aus vielen Haushalten (P2), Datenschutz | geparkt |
| P14 | **Gamification**: Fortschritt, Serien, «Bon komplett», Reineclaude-Erfolg | Macht das Erfassen zur Routine | Nach dem Pilot mit echten Zahlen. Gestaltung mit Alban ([`designsprache-garten.md`](./designsprache-garten.md)) | geparkt |
| P15 | **Aggregierte Food-Waste-Kennzahlen** für Handel, Forschung, Gemeinden | Einnahmen ohne Werbung. Messbarer Beitrag zum Ziel 2030 | Genug Haushalte, Anonymisierung (k-Anonymität), Einwilligung. Nie Einzeldaten verkaufen | geparkt |
| P16 | **Förderung** (z. B. StreamUp von United Against Waste, Innosuisse, Aktionsplan des Bundes gegen Lebensmittelverschwendung, Stiftungen) | Geld ohne Anteile abzugeben, dazu Glaubwürdigkeit und ein Netzwerk in der Branche | Passende Programme, Firmenform, Gesuch. StreamUp: siehe «P16 im Detail» | geparkt |
| P17 | **Büro-Kühlschrank für Teams** | B2B-Einnahmen pro Team | Eigener Vertrieb, Konten (P6) ([`monetarisierung.md`](./monetarisierung.md)) | geparkt |
| P18 | **Bestandesaufnahme per Foto** (Kühlschrank oder Einkauf fotografieren, Rettich erkennt die Lebensmittel) | Ersetzt den entfernten Umweg «Mit eigener KI». Ein Foto genügt, das wäre ein starkes Premium-Argument | KI-Kosten pro Bild, neuer Datenfluss (das Bild verlässt das Gerät), Qualität. Der Parser für die Liste ist da (ADR-0012) | geparkt |
| P19 | **Allergene pro Person**: wer im Haushalt was nicht verträgt, Warnung beim Scannen, Rezepte ohne dieses Allergen | Für Menschen mit Allergien ein Grund, Rettich jeden Tag zu öffnen, und ein starkes Pro-Argument. Die «Enthält»-Liste pro Produkt (Open Food Facts) zeigt Rettich schon heute | Gesundheitsdaten sind besonders schützenswert (nDSG Art. 5 lit. c, DSGVO Art. 9): nur auf dem Gerät, ausdrückliche Einwilligung. Haftung: offene Daten können fehlen oder falsch sein, darum nie «allergenfrei» versprechen. Fachlich prüfen lassen (z. B. aha! Allergiezentrum Schweiz) | geparkt |
| P20 | **Spaces**: Zuhause, Büro, Ferienwohnung, bei den Eltern; eine Person in mehreren Haushalten, oben umschalten | Ein Zugang für alle Kühlschränke im Leben; Brücke zum Büro-Kühlschrank (P17) | Auf einem Gerät ginge es ohne Server, das Datenmodell kennt Haushalte schon. Mit anderen teilen braucht Konten (P6). Gratis oder Pro? Darf das Erfassen nicht verkomplizieren | geparkt |
| P21 | **Geteilter Haushalt, ungleich diszipliniert**: eine Person trägt alles nach, die andere nie | Gut gelöst ein Vorteil, an dem Vorrats-Apps sonst scheitern: Der Bestand bleibt brauchbar, auch wenn nicht alle mitmachen | Konten und Sync (P6, P3). Gestaltung: siehe «P21 im Detail» | geparkt, Teile gebaut |
| P22 | **Von selbst erfasst**: Etiketten mit RFID oder NFC wie bei Decathlon, ein Kamera- oder Sensor-Modul, Rettich als Anbieter oder Lizenzgeber | Kein Aufwand mehr für die Person | Hardware bindet viel Kapital und rechnet sich bei Lebensmitteln kaum. Günstigere Wege zum selben Ziel: P1 und P10. Siehe «P22 im Detail» | geparkt, Vision |
| P23 | **Stammdaten-Pools** der Hersteller (GDSN, GS1 Schweiz trustbox) | Geprüfte Produktdaten mit Bild, Nährwerten und Allergenen, auch für Eigenmarken; so baut YAZIO seine «verifizierten» Produkte ([`mitbewerber-yazio.md`](./mitbewerber-yazio.md)) | Mitgliedschaft und Vertrag bei GS1 Schweiz, Kosten, Nutzungsrechte für eine App | geparkt |
| P24 | **Laden-Monogramme vor dem öffentlichen Start kurz prüfen lassen**: Rettich zeigt den Laden als eigenes Monogramm (Onyx-Kachel, silberner Serifen-Buchstabe, Smaragd-Linie), gleich für alle Läden, neben dem ausgeschriebenen Namen | Laden auf einen Blick erkennbar, ohne fremde Marken (Alban, 8.11.2026: «Ich will die Laden Logik … in unserer eigenen Design Language») | Kein Händler-Logo, keine Händlerfarben; der Name des Ladens dient nur als Angabe, wo gekauft wurde. Vor dem Start mit einer Fachperson bestätigen | geparkt |

## P1 im Detail: Migros und Coop als Partner

**Alban, 7.11.2026:** «Ich könnte mir vorstellen, Migros oder Coop meine App zu pitchen, damit sie Partner werden und die Nutzer über meine App Produkte nachkaufen können, als Provisionsmodell.»

**Technisch ist das einfach, sobald ein Händler öffnet.** Rettich hat die Anschlüsse schon, heute mit Mocks:

| Port in `packages/core/src/ports` | Was ein Partner liefert | Was es für die Person heisst |
| --- | --- | --- |
| `ProductCatalog` | Produktdaten per Barcode (Name, Grösse, Nährwerte, Bild) | Jeder Artikel ist vollständig, auch Eigenmarken |
| `RetailerReceiptSource` | Digitale Kassenzettel (Cumulus, Supercard) mit Einwilligung | Der Bon kommt von selbst, ohne Foto und ohne Lesefehler |
| `RebuyProvider` | Angebote zum Nachkaufen | «Milch ist leer – bei Migros nachkaufen?» |
| `DeliveryProvider` | Warenkorb beim Händler, Link zur Kasse | Ein Tipp füllt den Warenkorb, die Provision läuft über den Link |

Ein Partner-Adapter ist Arbeit von Tagen, nicht Monaten. Der Aufwand liegt beim Vertrag, bei der Einwilligung pro Haushalt (CLAUDE.md: widerrufbar, kein Verkauf von Einzeldaten) und bei einem Server für die Schlüssel des Partners (P6).

**Was die Händler davon haben (für den Pitch):**

- **Kundenbindung:** Die App nutzt man jeden Tag, nicht nur beim Einkaufen.
- **Nachkauf-Umsatz** im eigenen Online-Shop.
- **Nachhaltigkeitsziele:** Food Waste im Haushalt halbieren bis 2030 ([`markt-und-timing.md`](./markt-und-timing.md)).
- **Anonyme Erkenntnisse** dazu, was im Haushalt verdirbt, was zu gross verpackt ist und wo die Haltbarkeit zu knapp ist (P15).
- **Ein Abnehmer** für ihre digitalen Kassenzettel.

**Erste Schritte:**

1. Pilot mit echten Zahlen: gerettete CHF, aktive Haushalte, Bons pro Woche.
2. Pitch-Artifact um die Händler-Seite ergänzen.
3. Kontakt über Innovations- und Nachhaltigkeitsteams (Migros: z. B. Generation M; Coop: Nachhaltigkeit) statt über den Kundendienst.

## P21 im Detail: Der Bestand darf ungenau sein

**Alban, 7.11.2026:** «Ein Partner kann diszipliniert sein, ein anderer nicht. Wenn einer das nicht konsequent nachführt, stimmt es nicht.»

**Grundsatz:** Rettich verlangt keine Disziplin, es rechnet mit Lücken. Je weniger Aufwand eine Änderung kostet, desto öfter stimmt der Bestand.

**Schon gebaut:**

- **Kühlschrank-Check:** Einmal pro Woche korrigiert er in einer Minute, was niemand nachgeführt hat.
- **Wischen zum Essen** (#160, im Review): ein Wisch statt drei Tipps.
- **Quittung scannen:** Wer einkauft, erfasst für alle.
- **Besitz:** Jeder Artikel gehört einer Person oder allen (`owner`).

**Wenn Teilen kommt (P3, P6), Claudes Vorschlag:**

- **Ein Bestand mit «Mein Teil» und «Gemeinsam», nicht zwei Datenstände.** Zwei getrennte Stände wären zwei Wahrheiten: Welcher gilt dann für die Erinnerung? Mit dem Besitz kann die disziplinierte Person ihrem Teil trauen, ohne Widerspruch.
- **Stand-Anzeige pro Lagerort:** «Kühlschrank zuletzt geprüft vor 9 Tagen.» So sieht man, wie sicher der Bestand ist.
- **Nachfragen statt annehmen:** «Ist der Joghurt noch da?» bei Artikeln, die lange niemand angefasst hat.
- **Keine Schuldzuweisung:** kein Ranking, wer weniger nachführt. Das schützt den WG-Frieden.

## P22 im Detail: von selbst erfasst

**Alban, 7.11.2026 (Idee aus dem Schulprojekt):** Wie bei C&A oder Decathlon wird der Artikel automatisch erkannt, wenn man ihn hinlegt. Rettich könnte die Etiketten selbst anbieten oder das System lizenzieren, je nach Marge.

**Claudes Einschätzung:**

- **Warum es bei Kleidern geht:** Ein Pullover kostet 30 bis 100 Franken, ein Etikett einige Rappen. Bei einem Joghurt für 70 Rappen frisst das Etikett die Marge, denn der Detailhandel verdient netto nur wenige Prozent. Dazu kommt: Funk-Etiketten lesen sich durch Flüssigkeiten und Metall schlecht (Getränke, Dosen, Alu-Deckel), und sie landen im Abfall. Die Preise sind eine Grössenordnung, vor einem Pitch prüfen.
- **Etiketten selbst herstellen** wäre ein anderes Unternehmen: mit Fabriken, in einem Markt grosser Spezialisten.
- **Der Kern der Idee ist «erfasst sich beim Bezahlen von selbst».** Das geht ohne eigene Hardware:
  1. **Digitaler Kassenzettel** vom Händler (P1): Die Kasse kennt jeden Artikel schon mit Barcode. Mit Einwilligung kommt der Einkauf von selbst in Rettich, mit demselben Erlebnis und ohne Etikett.
  2. **2D-Code mit Ablaufdatum** (P10): Bis 2027 sollen Kassen 2D-Codes lesen können («Sunrise 2027»). Diese Codes tragen das Ablaufdatum, und Rettich liest sie schon.
  3. **Kamera im Kühlschrank:** Das gehört den Geräteherstellern (P12); Rettich wäre die Software darin.
- **Lizenz statt Hardware:** Wertvoll ist die Logik, nicht das Etikett: was abläuft, was zu retten ist, wem was gehört, Rezepte. Sie liegt sauber getrennt in `packages/core`. Zwei Wege:
  - ein Vorrats-Modul für die App eines Händlers, bezahlt pro aktivem Haushalt;
  - die offene Rettich-Schnittstelle (P11) für Gerätehersteller und Etiketten-Anbieter.

  Software hat eine hohe Marge, Hardware eine tiefe. **Empfehlung:** Software lizenzieren, Hardware nur mit Partnern.
- **Wann wieder prüfen:** wenn ein Händler Funk-Etiketten auf Lebensmitteln testet oder nach einem ersten Partner (P1).

## P16 im Detail: StreamUp und andere Förderung

**Alban, 7.11.2026:** «Die grössere Vision ist Food Waste, aber auch alles, was dazugehört. Es gibt auch Förderbeiträge», mit dem Hinweis auf [foodways.ch/streamup](https://foodways.ch/streamup/).

**StreamUp** (Stand der Websuche vom 7.11.2026; die Seite selbst war aus Claudes Umgebung nicht erreichbar, also vor einer Bewerbung dort prüfen):

- **Wer:** ein Förder- und Mentoring-Programm von United Against Waste (UAW), entwickelt und betrieben von Foodways.
- **Was:** Mentoring, Workshops und Zugang zum Netzwerk aus Branche, Forschung und Entscheidungsträger:innen der Lebensmittelbranche. Ob es auch Geld gibt, wird aus den Quellen nicht klar.
- **Für wen:** Start-ups, etablierte Firmen und Hochschulen mit Lösungen, die Lebensmittelverluste messbar senken, für den Schweizer Markt.
- **Rhythmus:** Die erste Kohorte lief Januar bis Juni 2025 (11 Projekte). Für die zweite wurden im April 2026 neun Teilnehmende gewählt.
- **Schwerpunkt:** bisher Nebenströme der Verarbeitung (z. B. Pasta aus altem Brot). Haushalte passen nur teilweise. Die Stärke von Rettich für eine Bewerbung: messbar gerettete Franken und Kilo pro Haushalt, aus dem Pilot.

**Quellen:** [United Against Waste: Konzept hinter StreamUp](https://united-against-waste.ch/medien-article/vom-nebenstrom-zur-hauptidee-das-konzept-hinter-streamup/), [Startupticker: zweite Kohorte](https://www.startupticker.ch/en/news/streamup-selects-nine-food-tech-companies-for-second-accelerator-cohort), [Swiss Food & Nutrition Valley: Interview zu StreamUp](https://swissfoodnutritionvalley.com/five-questions-for-streamup-project-lead-tatjana-nebel-about-supporting-swiss-food-loss-reduction-solutions/).

**Was es braucht:** Pilotzahlen (gerettete CHF und kg pro Haushalt und Monat), eine kurze Projektbeschreibung und je nach Programm eine Firmenform.

**Weitere Quellen**, ohne Gewähr: Innosuisse (Innovationsscheck, Start-up-Coaching), Stiftungen für Nachhaltigkeit, Förderprogramme der Kantone.

## Name und Vision (Findungsphase)

**Alban, 7.11.2026:** «Unsere App heisst Rettich, aber wir sind ja noch in der Findungsphase. FridgeAI war die ganze Vision. Die grössere Vision ist Food Waste, aber auch alles, was dazugehört.»

**Claudes Vorschlag: drei Ebenen trennen.**

| Ebene | Frage | Vorschlag | Wann entscheiden |
| --- | --- | --- | --- |
| **Mission** | Warum gibt es uns? | Food Waste im Haushalt halbieren, wie es das Schweizer Ziel für 2030 verlangt. Bleibt, egal wie Produkt und Firma heissen | jetzt (gilt schon) |
| **Produkt** | Was nutzt die Person? | **Rettich**, die App für den eigenen Haushalt | entschieden (ADR-0032) |
| **Firma oder Dach** | Wer steht dahinter? | Offen. Ein eigener Dachname lohnt sich erst, wenn mehrere Produkte kommen (Büro P17, Kennzahlen P15, Lizenz P22). Bis dahin genügt Rettich | bei der Gründung (Alban) |

**Warum Rettich die grosse Vision besser trägt als FridgeAI:**

- **Mission im Namen:** «rett' ich» sagt die Mission (retten), nicht ein Gerät. Der Name passt auch zu Vorrat, Tiefkühler, Rezepten, Weitergeben und Partnern wie Too Good To Go.
- **Zu eng:** «Fridge» bindet an den Kühlschrank, die Vision ist breiter.
- **Austauschbar:** «AI» kann heute jede App behaupten. Eine App «Fridge AI: Food & Recipes» gibt es schon ([`markt-und-timing.md`](./markt-und-timing.md)), also drohen Verwechslung und Ärger um die Marke.

**Vision in einem Satz** (Vorschlag): «Rettich hilft dir, kein Essen und kein Geld wegzuwerfen. Zusammen halbieren wir Food Waste bis 2030.»

«FridgeAI» bleibt nur der technische Name von Repo, Paketen und Datenbank (ADR-0032). Status: **geparkt**. Die Marke entscheidet Alban (P8).

## Geschäftsmodell-Entwurf (zu prüfen)

Stand: 7.11.2026, aufbauend auf [`monetarisierung.md`](./monetarisierung.md) und dem Businessplan. **Nichts davon ist entschieden.**

| Säule | Wer zahlt | Wofür | Voraussetzung | Wann |
| --- | --- | --- | --- | --- |
| 1. **Haushalts-Abo «Pro»** | Haushalte, WGs | ohne Werbung, mehrere Personen, Berichte, Sync | Konten (P6). Preisgrenze um CHF 3–5 pro Monat (Konkurrenz, siehe `monetarisierung.md`) | nach dem Pilot |
| 2. **Provision auf Nachkauf** | Händler, Lieferdienste | Nachkauf und Warenkorb aus Rettich | Vertrag (P1) | mit dem ersten Partner |
| 3. **Partner-Daten statt Werbung** | Händler, Marken | anonyme, aggregierte Kennzahlen (P15) | Grösse, Einwilligung, Anonymisierung | spät |
| 4. **Förderung und Impact** | öffentliche Hand, Stiftungen | messbar weniger Food Waste | Kennzahlen aus dem Pilot (P16) | parallel |
| 5. **Team-Lizenz** | Firmen | Büro-Kühlschrank (P17) | Konten, Vertrieb | später |
| 6. **Lizenz der Rettich-Logik** | Händler, Gerätehersteller | Vorrats-Modul in deren App oder Gerät (P22) | Pilotzahlen, stabile Schnittstelle (P11), Vertrag | spät |
| 7. **Bezahlte Dashboards** | Haushalte (Pro), Firmen, Gemeinden | tiefere Auswertungen: Verwertet und Entsorgt über Monate, pro Laden, pro Person (ADR-0046) | Konten (P6), Pilotzahlen | nach Pro |
| 8. **Werbung ohne Tracking** | Händler, Marken | Hinweise passend zum Vorrat, auf dem Gerät ausgewählt, ohne Profil (ADR-0046) | Albans Entscheid: heute verspricht Rettich «keine Werbung» | offen |

**Kandidaten für Pro:** Allergene pro Person (P19), Spaces (P20), Berichte, mehrere Personen.

**Kennzahlen, die das Modell prüfen:**

- Aktivierung: erster Bon in den ersten 24 Stunden.
- Wöchentlich aktive Haushalte.
- Gerettete CHF pro Haushalt und Monat.
- Wochen-4-Retention.
- Umwandlung zu Pro.
- Klickrate auf «Nachkaufen».

**Reihenfolge:** Pilot ohne Geld → Pro-Test → Pitch mit Pilotzahlen bei einem Händler → Provision → Daten und B2B.

## Kleinere Packung, konkret (8.11.2026)

- **Idee (Alban):** «Dieses Produkt gibt es auch in kleineren Grössen.» Beim Erfassen oder auf der Einkaufsliste nennt Rettich die konkrete kleinere Packung mit Preis, zum Beispiel die Tomatenmark-Tube statt der Dose.
- **Heute:** Der allgemeine Tipp der Kategorie kommt, sobald du dort zweimal etwas entsorgt hast (ADR-0038).
- **Braucht:** Packungsgrössen und Preise pro Produkt. Diese gibt es nur bei den Händlern oder in Open Food Facts (Grösse ja, Preis nein). Mit echten Händlerdaten wäre das eine Partner-Anbindung, die heute nur als Mock erlaubt ist.
- **Wert:** hoch, ein klarer USP («Rettich rät dir zur richtigen Grösse»), zusammen mit Händler-Partnerschaften (P-Einträge oben).

## Verlauf

| Datum | Änderung |
| --- | --- |
| 8.11.2026 | Säulen 7 und 8 (bezahlte Dashboards, Werbung ohne Tracking) aus Albans Nachricht zu «verwertet» und «entsorgt» (ADR-0046). |
| 7.11.2026 | P16 mit StreamUp (United Against Waste, Foodways) ergänzt; Abschnitt «Name und Vision» zu Rettich und FridgeAI. |
| 7.11.2026 | P23 (Stammdaten-Pools) aus der YAZIO-Analyse. |
| 7.11.2026 | Aus Albans Brainstorming: P19 (Allergene), P20 (Spaces), P21 (ungleiche Disziplin), P22 (von selbst erfasst, Etiketten, Lizenz). Dazu «Fokus jetzt», die Brainstorming-Regel und Säule 6 (Lizenz). |
| 7.11.2026 | P18 (Bestandesaufnahme per Foto) nach dem Entfernen von «Mit eigener KI». |
| 7.11.2026 | Parkplatz angelegt (Alban). Aus dem bisherigen Verlauf gesammelt: P1–P17, Geschäftsmodell-Entwurf. Quellen: Albans Wünsche vom 6. und 7.11.2026, `integrationen.md`, `produktdaten.md`, `schutz.md`, `monetarisierung.md`, `app-stores.md`, `designsprache-garten.md`, ADR-0019, ADR-0034 |

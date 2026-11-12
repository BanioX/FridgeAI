# Gastro-Version: Rettich-Logik als eigenes Produkt für Küchen

> **Status:** geparkt, Idee (Alban, 12.11.2026). Eintrag P29 im [Parkplatz](./parkplatz.md). Nichts davon ist beschlossen oder im [Plan](../plan.md).

**Alban, 12.11.2026:** «Eine B2B-Version als eigenes Produkt, ausgerichtet an der Gastronomie, ob Dönerladen als 1-Mann-Betrieb, Systemgastronomie, Küchenverarbeitung, Grossküche, Restaurant, Messeküche, Kantine. Als eigene Version mit anderem Branding, mehr Dunkelrot, premium wie Rotwein, anderer Name, selbe Logik.»

## Die Idee in einem Satz

Was Rettich für den Haushalt tut (wissen, was da ist, was bald abläuft, was verwertet und was entsorgt wurde, was es gekostet hat), tut ein zweites Produkt für Küchen: mit eigenem Namen, eigener Marke in Rotwein-Tönen und demselben Kern.

## Für wen

| Betrieb | Alltag heute | Was die Rettich-Logik bringt | Was dazukommt |
| --- | --- | --- | --- |
| **Ein-Personen-Betrieb** (Dönerladen, Imbiss, Foodtruck, Take-away) | Bestellt aus dem Kopf, Fleisch und Saucen laufen ab, keine Zeit für Listen | Lieferschein fotografieren statt tippen, «heute retten» am Morgen, Bestellvorschlag aus dem Mindestbestand | Ein Gerät, ganz wenig Aufwand, ohne Schulung nutzbar |
| **Restaurant** (5 bis 30 Mitarbeitende) | Mise en place, Kühlzelle, Weinkeller, wechselnde Karte | Lager nach Kühlzelle, Tiefkühlzelle, Trockenlager und Posten; Verarbeiten mit Wert (ADR-0052) zeigt den Wareneinsatz | Team mit Rollen, Tablet in der Küche, mehrere Geräte gleichzeitig |
| **Systemgastronomie** (Ketten, Filialen) | Gleiche Produkte in vielen Filialen, Zentraleinkauf | Vergleich der Filialen bei Abfall und Wareneinsatz | Mehrere Standorte, Zentrale mit Übersicht, Vorgaben pro Kette |
| **Grossküche und Küchenverarbeitung** (Produktionsküche, Cook & Chill) | Grosse Gebinde, vorproduzierte Komponenten mit Etikett | Etikett mit Produktionsdatum und QR-Code (wie O10 «Reste-Etikett»), Ablauf pro Charge | Chargen, Rückverfolgbarkeit, Gebinde (Kiste, Kolli, kg) |
| **Kantine, Mensa, Personalrestaurant** | Planbare Menüs, schwankende Gästezahl, Tellerrücklauf | Abfall nach Art messen (Lager, Produktion, Teller), Klimabilanz für den Nachhaltigkeitsbericht (ADR-0057) | Menge pro Gedeck, Berichte für die Auftraggeberin |
| **Messe-, Event- und Bankettküche, Catering** | Grosse Mengen auf einen Tag, viel bleibt übrig | Was übrig ist, sofort erfassen und weitergeben (Brücke zu P27 und P28) | Anlass als eigener «Ort» mit Start und Ende |
| *Später: Spital und Heim* | Strenge Hygiene, Diäten | wie Kantine | Allergene und Diätformen (P19), höhere Anforderungen |

## Selbe Logik, andere Wörter

| Rettich (Haushalt) | Gastro-Version |
| --- | --- |
| Quittung scannen | Lieferschein oder Rechnung des Grosshändlers lesen (PDF, Foto) |
| Kühlschrank, Tiefkühler, Vorrat | Kühlzelle, Tiefkühlzelle, Trockenlager, Posten, Weinkeller |
| Plätze mit Foto (ADR-0056) | Regale und Fächer in der Kühlzelle |
| Ablaufdatum, «Heute retten» | FIFO und FEFO, Tagesliste für den Küchenchef |
| Verwertet, Entsorgt, Töpfe (ADR-0055) | Abfall nach Art: Lagerverlust, Produktionsabfall, Tellerrücklauf |
| Verarbeiten, Reste (ADR-0052) | Rezeptur und Produktion: Rohware wird Komponente, der Wert wandert mit |
| Nachkaufen, Mindestbestand (ADR-0059) | Bestellvorschlag pro Lieferant |
| Haushalt, Mitglieder, «Gehört» (ADR-0058) | Betrieb, Team, Posten |
| Auszüge und PDF | Monatsbericht: Wareneinsatz, Abfall in CHF und kg, Klimabilanz |

Der Kern in `packages/core` ist bewusst ohne Browser und über eine Schnittstelle gebaut (Contract-first, ADR-0005). Eine zweite App mit eigenem Theme, eigenem Textkatalog und einem Gastro-Katalog (Gebinde, Grosshandelspreise) wäre darum möglich, ohne den Haushalt umzubauen.

## Eigene Marke

- **Farbe:** Rotwein statt Smaragd. Vorschlag zum Ausprobieren: Rotwein `#6D1F2F` als Hauptfarbe (mit Weiss gerechnet rund 11:1 Kontrast), dunkle Traube `#3F0F1C` für Flächen, Kork `#E8D9C0` als warme Begleitfarbe, Onyx für Schrift wie bei Rettich. Wirkt wie eine Weinkarte: ruhig, edel, für Profis.
- **Name** (Arbeitstitel, nichts geprüft):
  - **Randen:** dunkelrot wie Rotwein, Wurzelgemüse wie der Rettich, typisch Schweizerdeutsch. Familie statt Kopie: Rettich für zuhause, Randen für die Küche.
  - **Rettwerk:** «retten» und «Werk», klingt nach Betrieb.
  - **Mise:** von «mise en place», kurz und international.
- **Ton:** Rettich sagt immer «du». In vielen Küchen duzt man sich auch; ob die Gastro-Version «du» oder «Sie» sagt, entscheidet Alban.
- Alles vor dem ersten Auftritt prüfen: Marke (Swissreg, EUIPO), Domain, Verwechslung mit bestehenden Gastro-Marken ([`schutz.md`](./schutz.md)).

## Warum es passen könnte

- **Wer zahlt:** Betriebe zahlen für Werkzeuge, die Geld sparen, eher als Haushalte. Ein Abo pro Standort ist in der Branche üblich (zu prüfen).
- **Druck von aussen:** Der Bund will die Lebensmittelverschwendung bis 2030 halbieren (Aktionsplan 2022); Betriebe der Gastronomie haben sich in einer Branchenvereinbarung dazu verpflichtet und müssen messen (Umfang und Pflichten zu prüfen, [`markt-und-timing.md`](./markt-und-timing.md)).
- **Lücke:** Bekannte Lösungen messen den Abfall am Kübel, oft mit Waage und Kamera (z. B. KITRO aus Zürich, Winnow, Leanpath, Orbisk; zu prüfen). Lagerprogramme für Restaurants (z. B. Apicbase, MarketMan) sind gross und teuer. Die Gastro-Version setzt **vor** dem Kübel an (Lager, Ablauf, Bestellung), braucht keine Hardware und passt auch zum Dönerladen.
- **Brücke zu anderen Hebeln:** Restaurants und Kantinen als Abnehmer von Überschüssen (P28), Förderung über United Against Waste und StreamUp (P16), Büro-Kühlschrank (P17).

## Was abzuklären ist

| Thema | Frage | Wer |
| --- | --- | --- |
| Technik | Konten, Sync und Server sind Pflicht: Eine Küche arbeitet mit mehreren Geräten gleichzeitig (P6, Meilenstein C) | Claude, Kosten Alban |
| Recht | Lebensmittelrecht und Selbstkontrolle (HACCP): Die App ist ein Hilfsmittel, kein Nachweis; Haftung, Temperaturprotokolle, Rückverfolgbarkeit | Fachperson, Rolle Recht |
| Datenschutz | Daten von Mitarbeitenden (wer hat was entsorgt) nach nDSG; keine Überwachung einzelner Personen | Rolle Recht |
| Partner | Grosshändler (z. B. Prodega, Transgourmet, Saviva, Pistor): heute nur Dokumente lesen und Mocks, keine echte Anbindung (harte Regel) | Alban |
| Geld | Preis pro Standort, Stufen vom Einzelbetrieb bis zur Kette, Vertrieb (GastroSuisse, Messe IGEHO) | Alban |
| Marke | Name, Farben, Logo, Markenprüfung | Alban, Rolle Design |
| Sprache | Küchen sind oft mehrsprachig: Deutsch, Französisch, Italienisch, Portugiesisch, Tamil, Türkisch | später |

## Aufwand und Reihenfolge

- **Aufwand:** L. Der Kern ist da; neu wären Konten und Sync, Mehrbenutzer mit Rollen, Gebinde, Lieferschein-Parser, Berichte, eine zweite App mit eigener Marke.
- **Reihenfolge:** erst der Haushalts-Pilot mit Zahlen, dann Konten und Sync (P6), dann ein Gastro-Pilot mit einem einzigen Betrieb (ein Imbiss ist am einfachsten, eine Kantine am ergiebigsten). Erst danach Kette oder Grossküche.
- **Bis dahin:** Wo es nichts kostet, baut Claude Rettich so, dass die zweite App leicht bleibt: Farben nur als Tokens, Texte nur im Textkatalog, Kategorien als Katalog, alles über die Schnittstelle.

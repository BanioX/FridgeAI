# Komfort, Geld und Mitbewerber

Albans Fragen vom 11.11.2026: «Eine Quality-of-Life-Analyse und was die App bräuchte, um Geld zu machen. Mitbewerber wie YAZIO oder Open Food Facts. Augenmerk auf Food-Waste-Reduktion; einen Kalorientracker oder Nährwerte unterwegs zu haben ist auch nicht verkehrt, aber nicht unsere Kernkompetenz.»

Vorschlag von Claude. Was Geld kostet, Daten neu vom Gerät schickt oder die Grenze zwischen Gratis und Pro zieht, entscheidet Alban (CLAUDE.md, Regel 5). Fortsetzung von [`fahrplan-12-monate.md`](./fahrplan-12-monate.md) und [`monetarisierung.md`](./monetarisierung.md).

## Kurz

- **Rettich zählt Franken, nicht Kalorien.** Kein Mitbewerber verbindet Quittung, Vorrat, Wert in Franken, «Heute retten» und den geteilten Haushalt.
- **Nährwerte bleiben Beifahrer:** anzeigen ja, Tagebuch und Ziele nein. Das ist YAZIOs Spiel, mit Datenbank und Team, die Rettich nicht hat.
- **Die wichtigste Komfort-Funktion fehlt noch: die Erinnerung.** Mit der App aus dem Store geht sie als lokale Mitteilung, ganz ohne Server.
- **Für Geld fehlen vier Bausteine:**
  - die gemessene Wirkung;
  - die App in den Stores mit In-App-Kauf;
  - die Grenze zwischen Gratis und Pro;
  - Kennzahlen ohne Tracking.

## Mitbewerber

| App | Was | Preis | Stärke | Lücke für Rettich |
| --- | --- | --- | --- | --- |
| **YAZIO** | Kalorienzähler, kuratierte Datenbank | Pro EUR 30–84 pro Jahr | Datenbank, Ziele, Gewohnheit, viel Werbebudget | Kein Vorrat, kein Ablauf, keine Franken. Könnte einen Vorrats-Modus nachrüsten ([`mitbewerber-yazio.md`](./mitbewerber-yazio.md)) |
| **Open Food Facts** | Offene Datenbank und Scan-App: Nutri-Score, NOVA, Green-Score, Allergene; neu «Open Prices» (Preise aus Quittungen, von allen gesammelt) | gratis, gemeinnützig | Offene Daten, weltweit | Kein Vorrat, kein Haushalt. **Partner, nicht Gegner:** Rettich nutzt die Daten schon |
| **Too Good To Go** | Überschüsse aus Läden und Gastronomie | Provision von den Betrieben | 2.6 Mio. Registrierte in der Schweiz | Hilft beim Laden, nicht im eigenen Kühlschrank. Partner |
| **Bring!** (Zürich) | Einkaufsliste, geteilt im Haushalt | gratis, verdient mit Marken-Werbung | 21 Mio. Nutzer:innen, in vielen Schweizer Haushalten | Weiss nicht, was zu Hause liegt. Vorbild für Geld mit Kontext-Werbung |
| **NoWaste** | Vorratsliste mit Barcode, Ablauf, Essensplan | Pro USD 6.99 pro Jahr oder USD 29.99 einmalig | Lange am Markt, günstig | Keine Quittung, keine Franken, international |
| **Samsung Food** | Rezepte, Vorrat, Essensplan | Food+ USD 60 pro Jahr | Teil des Samsung-Haushalts | Rezepte zuerst; Food Waste ist Nebensache |
| **ZWIMP**, **Kühlbär** (Schweiz) | Quittungs-Import (ZWIMP), Spar-Zähler in Franken (Kühlbär) | CHF 4.90 und CHF 3 pro Monat | Schweizer Fokus | Laut Blue-Ocean-Analyse (6.11.2026), heute nicht nachgeprüft |
| **Migros- und Coop-App** | Digitale Quittung (Cumulus, Supercard) | gratis | Haben alle Einkäufe | **Grösstes Risiko und grösste Chance:** bauen sie einen Vorrat selbst, oder holen sie ihn als Modul (P1)? |
| Kitche, CozZo | Quittungs-Scan, Vorrat | eingestellt | – | Lehre: gratis ohne Modell und abhängig von einer Cloud scheitert |

## Nährwerte: ja, aber als Beifahrer

**Schon da:** Nährwerte, Nutri-Score und Allergene von Open Food Facts; fehlen sie, liest Rettich das Foto der Nährwerttabelle auf dem Gerät.

**Sinnvoll, weil billig und nah am Vorrat:**
- **Nährwerte auf einen Blick** auf der Artikelseite, auch pro Packung (nicht nur pro 100 g). Aufwand S.
- **Allergene im Haushalt:** «enthält Nüsse» in der Liste, wenn jemand in der WG das ausschliessen will. Aufwand S–M.
- **Unverpacktes** (Rüebli, Äpfel, Brot vom Bäcker) aus der Schweizer Nährwertdatenbank des BLV (Y1). Aufwand M.

**Bewusst nicht:** Ernährungstagebuch, Kalorienziele, Makros, Gewicht. Gründe:
- YAZIO hat eine Datenbank und ein Team, die Rettich nicht hat.
- Wer etwas «verwertet», sagt nicht, wie viel er davon gegessen hat; die Zahlen wären geraten.
- Es lenkt vom Kern ab (ADR-0046: Awareness, kein Yazio).

**Später** (Parkplatz, mit der nativen App): Nährwerte an Apple Health oder Google Health Connect übergeben, wenn die Person es will.

## Komfort: was den Alltag leichter macht

Sortiert nach Wirkung auf Food Waste und Aufwand (S klein, M mittel, L gross).

| # | Funktion | Wirkung auf Food Waste | Aufwand | Gratis oder Pro | Bedingung |
| --- | --- | --- | --- | --- | --- |
| K1 | **Erinnerung am Morgen:** «2 Sachen laufen heute ab» | hoch | M | gratis | Native App: lokale Mitteilung auf dem Gerät, kein Server, keine neuen Datenflüsse ([`benachrichtigungen.md`](./benachrichtigungen.md)) |
| K2 | **Zahl am App-Symbol** für «Heute retten» (umgesetzt 11.11.2026, [ADR-0050](../adr/0050-impact-since-first-month.md)) | mittel | S | gratis | keine |
| K3 | **«Ist das noch gut?» (umgesetzt 11.11.2026)** beim Entsorgen von Ware mit Mindesthaltbarkeit: «Schauen, riechen, probieren», dann erst entsorgen | hoch | S | gratis | keine; der Text steht schon unter «Wissen» |
| K4 | **Einfrieren mit einem Tipp (umgesetzt 11.11.2026)**, wenn das Verbrauchsdatum morgen ist (Hackfleisch, Fisch) | hoch | S | gratis | keine |
| K5 | **Mengen-Tipp auf der Einkaufsliste:** «Brot entsorgst du oft: kleiner kaufen oder halb einfrieren» | hoch | S | gratis | keine; die Daten gibt es («Das entsorgst du oft») |
| K6 | **Reste erfassen (umgesetzt 11.11.2026, [ADR-0052](../adr/0052-processing-value-moves-along.md)):** «Reste vom Abendessen», 3 Tage haltbar, mit einem Tipp | mittel | S | gratis | keine |
| K7 | **Kühlschrank-Check als Stapel:** eine Karte nach der anderen wischen, 30 Sekunden | mittel | S–M | gratis | keine |
| K8 | **Dauer-Scan:** mehrere Barcodes nacheinander, ohne jedes Mal zurück | mittel (Erfassen schneller) | S–M | gratis | keine |
| K9 | **Haushalt teilen (WG):** alle sehen denselben Vorrat | hoch | L | gratis für einen Haushalt | Sync, neuer Datenfluss: Alban |
| K10 | **Teilbare Monats-Bilanz** als Bild für Instagram und WhatsApp | indirekt (Wachstum) | S | gratis | keine; das Bild entsteht auf dem Gerät |
| K11 | **Widget** «Heute retten» auf dem Home-Bildschirm | mittel | M | Pro | native App |
| K12 | **Dunkelmodus** | Komfort | M | gratis | keine |
| K13 | **Einkaufsliste weitergeben** als Text an Bring! oder WhatsApp | tief | S | gratis | keine |
| K14 | **Sprach-Erfassung:** «Milch, Eier, Brot» | mittel | M | gratis | Prüfen, ob die Spracherkennung des Systems Daten an Apple oder Google schickt |

**K5 und K13, Stand 11.11.2026:** umgesetzt auf «Nachkaufen». K5: unter einem Eintrag, dessen Kategorie der Haushalt oft entsorgt («Das entsorgst du oft»), steht eine ruhige Zeile mit dem Tipp der Kategorie (`shoppingTips` im Kern). K13: «Liste teilen» macht aus den offenen Einträgen Text, über `navigator.share` oder die Zwischenablage, nur nach einem Tipp; nichts geht automatisch raus.

**K14, Stand 11.11.2026:** v1 ist umgesetzt als «Einkaufsliste aus einem Satz» auf «Nachkaufen»: Die Person diktiert über das Mikrofon der Tastatur oder tippt, `parseShoppingText` zerlegt den Satz auf dem Gerät. Keine Web Speech API, kein Datenfluss aus der App, keine Kosten (ob die Diktierfunktion der Tastatur selbst Daten an Apple oder Google schickt, entscheidet das Gerät der Person, nicht Rettich). Offen: Erfassen im Vorrat per Satz.

## Was es für Geld braucht

| # | Baustein | Warum | Aufwand | Entscheid |
| --- | --- | --- | --- | --- |
| G1 | **Wirkung messen:** «Seit Rettich entsorgst du x % weniger», verglichen mit dem ersten Monat (umgesetzt 11.11.2026, [ADR-0050](../adr/0050-impact-since-first-month.md)) | Grundlage für Preis, Werbung (UWG) und jeden Partner | S | Claude |
| G2 | **Native Apps in den Stores** (Capacitor, P7) | In-App-Kauf, Mitteilungen, Sichtbarkeit | M | Alban: Store-Konten rund CHF 125 im ersten Jahr |
| G3 | **In-App-Kauf** (StoreKit, Google Play Billing), wiederherstellbar ohne Konto | Digitale Abos in der App laufen über die Stores (genaue Regeln für die Schweiz prüfen) | M | Alban: Preis |
| G4 | **Gratis und Pro in `core`** (Plan 12b), 14 Tage Probezeit, Bezahlseite mit der eigenen Ersparnis | Ohne klare Grenze gibt es nichts zu verkaufen | M | Alban: Grenze |
| G5 | **Pro-Inhalt** (Vorschlag): Auszüge über Monate und Jahre, Jahresbilanz, Trends nach Kategorie und Laden, Preis-Gedächtnis mit Verlauf, Widgets, mehrere Haushalte (Ferienwohnung, Büro). **Gratis bleibt alles, was Food Waste direkt senkt**, und der Export der eigenen Daten (ADR-0020) | Pro verkauft Einblick und Komfort, nicht das Retten selbst | – | Alban |
| G6 | **Kennzahlen ohne Tracking:** wie viele bleiben nach 7 und 30 Tagen, wie viele wechseln zu Pro. Nur gezählt, anonym, mit Einwilligung | Ohne Zahlen kein Steuern und kein Partnergespräch | M | Alban: neuer Datenfluss |
| G7 | **Rechtliches:** Firmenform (Einzelfirma reicht für den Anfang), AGB, Datenschutzerklärung durch eine Fachperson, Impressum, einfache Abo-Kündigung (in Deutschland Pflicht), MWST erst ab CHF 100'000 Umsatz | Pflicht vor dem ersten Franken | – | Alban |
| G8 | **Feedback und Bewertung:** Mail-Link in der App, Bitte um eine Store-Bewertung nach der dritten Rettung | Store-Sichtbarkeit, Fehler früh sehen | S | Claude |
| G9 | **Partner-Bausteine:** Code einer Gemeinde oder eines Arbeitgebers beim Start, anonymer Wirkungs-Bericht pro Programm, nur mit Einwilligung | Grundlage für Geld von Gemeinden und Firmen | M–L | Alban: Verträge |
| G10 | **Konto und Sync** | Haushalts-Abo, Gerätewechsel, Haushalt teilen | L | Alban: Server, Datenfluss |

## Reihenfolge (Vorschlag)

1. **Jetzt**, ohne Kosten und ohne neue Datenflüsse: K3, K4, K5, K6, K2 und G1. Das senkt Food Waste direkt und liefert die Zahl, mit der sich alles Weitere verkauft.
2. **Mit dem Store-Start im Januar:** G2, K1 (lokale Erinnerung), G3 technisch vorbereitet, Pro noch aus.
3. **Februar bis März:** K9 Haushalt teilen und G4/G5 Pro mit Probezeit, sobald Alban Grenze und Preis entschieden hat. Dazu K10 für das Wachstum.

## Runde 2 (Alban, 11.11.2026)

Alban: «Mehl zu Brot verarbeitet, dann kann man das badgen. Einen Kuchen backen und Eier verwerten. Ein Rezept kochen und Reste landen im Kühlschrank. Abzeichen wie Koch, Sparsam, Überlebenskünstler.» Eingeordnet als **jetzt**, nach Runde 1 (dieselben Dateien), gratis und ohne neuen Datenfluss:

| # | Idee | Nutzen | Aufwand |
| --- | --- | --- | --- |
| R2-1 | **Badges am Artikel** in passender Farbe: Eingefroren (Eis), Aufgetaut (Eis hell, neu), Geöffnet (Aprikose), Selbst gemacht (Weizen), Reste (Smaragd hell), Von der Theke (Oliv) | Zustand auf einen Blick | S–M. **Umgesetzt** (11.11.2026, ADR-0051) für Eingefroren, Aufgetaut, Geöffnet, Von der Theke; Selbst gemacht und Reste folgen mit R2-2/R2-3 |
| R2-1b | **Zutat oder Fertigprodukt** (Alban, 11.11.2026: Skyr Cheesecake ist kein Joghurt für Müesli): Rolle je Kategorie, neue Kategorie Desserts, Schalter am Artikel, Hinweis aus dem Barcode (NOVA 4), Badge «Fertigprodukt», Rezepte zählen nur Zutaten, ausser das Rezept verlangt Fertiges (Oreo Cheesecake) | Ehrliche Rezeptvorschläge, kein Convenience-Essen als «Joghurt» | S–M. **Umgesetzt** (11.11.2026, ADR-0053) |
| R2-2 | **Verarbeiten (umgesetzt 11.11.2026, [ADR-0052](../adr/0052-processing-value-moves-along.md)):** Zutaten (auch Teile) werden verwertet, das Ergebnis kommt als neuer Artikel mit eigener Haltbarkeit in den Vorrat. Der Wert wandert mit, damit nichts doppelt zählt | Kuchen, Brot, Zopf, Reste ehrlich in der Bilanz | M |
| R2-3 | **«Gekocht» (umgesetzt 11.11.2026)** auf der Rezeptseite bucht die Zutaten ab und fragt «Reste in den Kühlschrank?» (ersetzt R-03 aus ADR-0048) | Kochen schliesst den Kreis | M |
| R2-4 | **Abzeichen (umgesetzt 12.11.2026, [ADR-0054](../adr/0054-achievements.md))** nach [`../abzeichen.md`](../abzeichen.md); «Gemeinsam» folgt mit «Haushalt teilen» | Freude, Wiederkommen, ohne Kaufanreiz | M |

## Für den Parkplatz

- **Preise an Open Prices spenden:** Quittungspreise anonym an die offene Preis-Datenbank von Open Food Facts, nur mit Einwilligung. Gibt der Gemeinschaft etwas zurück, deren Daten Rettich nutzt. Neuer Datenfluss: Alban.
- **Nährwerte an Apple Health oder Google Health Connect**, mit der nativen App.

## Quellen

- Open Food Facts App: [App Store](https://apps.apple.com/app/id588797948), [Open Food Facts](https://world.openfoodfacts.org/open-food-facts-mobile-app)
- NoWaste: [App Store](https://apps.apple.com/us/app/-/id926211004)
- YAZIO, Samsung Food, Abo-Kennzahlen: [`markt-und-timing.md`](./markt-und-timing.md), [`mitbewerber-yazio.md`](./mitbewerber-yazio.md)
- ZWIMP, Kühlbär, Bring!: Blue-Ocean-Analyse vom 6.11.2026 ([`../blue-ocean.md`](../blue-ocean.md))

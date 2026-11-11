# Monetarisierung: gratis mit Werbung, Pro ohne Werbung und Tracking

Brainstorming nach Albans Idee (6.11.2026): «Eventuell gratis mit Tracking und Werbung, Paid ohne Tracking und Werbung, je nach Erfolg.» Grundlage: ADR-0015 (proprietär, Freemium offen). Entschieden wird nach dem Pilot (Plan, Frage 5).

## Modelle

| Modell | Für wen | Einnahmen | Risiko |
| --- | --- | --- | --- |
| **Gratis + Kontext-Werbung** (Werbung passend zum Inhalt, ohne Profil: «Joghurt läuft ab» → Rezept-Partner) | alle | klein bis mittel | wenig: keine Einwilligung nötig, wenn nichts über die Person gespeichert wird |
| **Gratis + personalisierte Werbung** (Profil aus Einkäufen) | wer einwilligt | mittel | hoch: braucht ausdrückliche, widerrufbare Einwilligung (DSG, DSGVO); Vertrauensverlust |
| **Pro-Abo ohne Werbung und Tracking** | Vielnutzer:innen, Haushalte | planbar | Preisgrenze (ZWIMP CHF 4.90, Kühlbär CHF 3) |
| **Haushalts-Abo** | WGs, Familien | planbar, Kosten pro Person klein | Mitgliederverwaltung (Schritt 7) |
| **Partner-Provision** (Nachkauf, Lieferdienst, Rezepte) | alle | pro Abschluss | nur Interfaces und Mocks bis zum Vertrag (CLAUDE.md) |
| **Büro-Kühlschrank für Teams** (use-cases 2d) | Firmen | pro Team und Monat | eigener Vertrieb |
| **Anonyme, aggregierte Insights** (Food-Waste-Trends pro Region) | Handel, Forschung | gross, aber spät | nur mit genug Nutzenden und sauberer Anonymisierung (Plan, Frage 13) |

## Empfehlung (Stand Pilot)

1. **Pilot ohne Werbung.** Es gibt zu wenige Nutzende, und Werbung würde das Feedback verfälschen.
2. **Technisch vorbereiten:**
   - `free | pro` als Funktion (Plan 12b);
   - ein Platz für Werbung, der leer bleibt;
   - ein Einwilligungs-Schalter pro Zweck, aus per Default.
3. **Nach dem Pilot** ist die stärkste Kombination: gratis mit **Kontext-Werbung ohne Tracking** plus **Pro** (werbefrei, mehr Statistik, Menüplanung, mehrere Haushalte, Büro). Personalisierte Werbung nur als freiwilliges Opt-in mit Gegenleistung, z. B. Rabatte.

**Warum nicht «zahl oder lass dich tracken»:** In der EU sieht der Datenschutzausschuss «Pay or Okay» kritisch (Stellungnahme 08/2024 zu grossen Plattformen). Wer DACH will, ist mit einer dritten, kostenlosen Option ohne Tracking auf der sicheren Seite. Kontext-Werbung ist genau das.

## Hochrechnung: CHF 1 einmalig oder Abo (11.11.2026)

Albans Frage: Was bringt es, wenn jede Person entweder einmal CHF 1 zahlt oder ein Abo hat? Grundlage sind die belegten Zahlen in [`markt-und-timing.md`](./markt-und-timing.md): 4.0 Mio. Haushalte in der Schweiz, rund CHF 600 Lebensmittel pro Haushalt und Jahr im Abfall (WWF 2021). **Alles hier ist eigene Rechnung.**

**Was pro Zahlung bleibt** (Store-Gebühr 15 % im Small-Business-Programm, MWST 8.1 % ist im Preis):

| Preis | bleibt bei Rettich |
| --- | --- |
| CHF 1 einmalig, im App Store | rund CHF 0.79 |
| CHF 1 einmalig, im Web per Karte (2.9 % + CHF 0.30) | rund CHF 0.60 |
| CHF 29 pro Jahr | rund CHF 22.80 pro Jahr |
| CHF 2.90 pro Monat | rund CHF 27.40 pro Jahr |

**Umsatz netto in der Schweiz**, je nach Anteil der Haushalte, die Rettich nutzen:

| Haushalte mit Rettich | CHF 1 einmalig (alle zahlen) | Abo CHF 29, alle zahlen | Gratis plus Pro für 2–5 % |
| --- | --- | --- | --- |
| 0.5 % = 20'000 | CHF 16'000, **einmal** | CHF 456'000 pro Jahr | CHF 9'000–23'000 pro Jahr |
| 2 % = 80'000 | CHF 63'000, einmal | CHF 1.8 Mio. pro Jahr | CHF 36'000–91'000 pro Jahr |
| 5 % = 200'000 | CHF 157'000, einmal | CHF 4.6 Mio. pro Jahr | CHF 91'000–228'000 pro Jahr |

DACH (rund 49 Mio. Haushalte) mit 0.5 %: einmalig rund CHF 190'000, Abo für alle rund CHF 5.6 Mio. pro Jahr, Pro für 3 % rund CHF 170'000 pro Jahr (in Franken gerechnet, Preise dort noch offen).

**Was daraus folgt:**
- **CHF 1 einmalig finanziert nichts.** Es fliesst nur einmal pro Haushalt, die Gebühren fressen 20–40 %, und jede Bezahlschranke vor dem Download senkt die Downloads. Ein Kaufpreis lohnt sich erst um CHF 15–30.
- **Ein Abo bringt pro zahlendem Haushalt über drei Jahre rund 85-mal mehr** als CHF 1 einmalig (CHF 68 statt 0.79), vor Kündigungen.
- **«Alle zahlen» ist die Obergrenze, nicht der Plan.** Realistisch ist gratis plus Pro mit 2–5 % Umwandlung, oder ein Abo mit Probezeit, das weniger, aber zahlende Haushalte erreicht.
- **Kosten pro Haushalt sind heute fast null** (alles auf dem Gerät, Cloudflare gratis). Erst Sync und Konten (Meilenstein C) bringen Serverkosten pro Haushalt.

**Framing «Mit Rettich sparst du beim Essen, weil du es nicht wegwirfst»:**

| Rettich senkt den Abfall um | gespart pro Jahr | pro Monat | im Verhältnis zu CHF 29 |
| --- | --- | --- | --- |
| 10 % | CHF 60 | CHF 5 | 2-mal |
| 25 % | CHF 150 | CHF 12.50 | 5-mal |
| 50 % | CHF 300 | CHF 25 | 10-mal |

- Wie stark Rettich den Abfall wirklich senkt, ist noch nicht gemessen. Der Pilot soll es messen: Die «Bilanz» zeigt «Entsorgt» pro Monat.
- Werbung mit einer festen Ersparnis braucht einen Beleg (UWG, irreführende Angaben). Stärker und sicher ist die eigene Zahl jeder Person: «Dieses Jahr gerettet: CHF 184. Rettich Pro kostet CHF 29.»
- Preise und die Grenze zwischen Gratis und Pro entscheidet Alban.

## Was Daten dafür bedeuten

Siehe ADR-0020: Rohdaten so kurz wie möglich aufbewahren. Für Zielgruppen und Werbung reichen Aggregate: Alter grob, Haushaltsgrösse, Kategorien pro Monat. Einzelne Einkäufe braucht es dafür nicht. Kein Verkauf von Einzeldaten (CLAUDE.md).

## Zu klären (Alban)

- Preise und Grenzen zwischen Gratis und Pro.
- Kosten für die App-Stores, falls es eine native App gibt ([`scan-und-produktdaten.md`](./scan-und-produktdaten.md)).
- Rechtliche Prüfung vor der ersten Werbung (Datenschutzerklärung, Einwilligung).

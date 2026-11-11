# Fahrplan 12 Monate: von 1'000 bis 1 Mio. Haushalte

Albans Fragen vom 11.11.2026: «Ist da Cash möglich für mich? Hochrechnung Food-Verlust. Wenn du der Besitzer wärst und Geschwindigkeit das Wichtigste ist: Wie skalierst du auf 1'000, 10'000, 100'000 und 1 Mio. Nutzer? Was ist der Fahrplan für 12 Monate?»

Das ist ein Vorschlag von Claude. Entscheide mit Kosten, neuen Datenflüssen oder Partnerverträgen trifft Alban (CLAUDE.md). Grundlage sind die belegten Zahlen in [`markt-und-timing.md`](./markt-und-timing.md) und die Hochrechnung in [`monetarisierung.md`](./monetarisierung.md). Gerechnet wird mit 1 Nutzer = 1 Haushalt; das ist vorsichtig, weil sich in einer WG mehrere einen Haushalt teilen.

## Betriebsmodell: allein, rund 2 Stunden pro Woche

Alban, 11.11.2026: «Ich bin allein und bleibe es auch, zudem 90 % Job und 20 % Schule und das hier nebenbei. Du musst die ganze Arbeit machen.» Daraus folgen drei Regeln für alles in diesem Fahrplan:

1. **Claude macht alles, was Text, Code oder Bild ist:**
   - Programm und Tests, Releases, Doku;
   - Datenschutzerklärung, Store-Texte und Screenshots;
   - Startseite und Google-Seiten;
   - Beiträge für Social Media, Pressetexte, Förderanträge, Mails an Partner (als Entwurf).
2. **Alban macht nur, was eine Person mit Namen, Ausweis, Unterschrift oder Kreditkarte braucht:**
   - Konten eröffnen, Domain kaufen;
   - Mails abschicken, Anrufe;
   - Entscheide mit Ja oder Nein.
3. **Nur Wege ohne laufenden Betrieb:**
   - Alles bleibt auf dem Gerät; der einzige Server ist später der Sync für «Haushalt teilen», Ende-zu-Ende verschlüsselt auf Cloudflare (Gratis-Plan).
   - Bezahlt wird über die App-Stores: Sie rechnen ab, ziehen die MWST ein und erledigen Rückerstattungen.
   - Wachstum über Kanäle, die allein laufen: Suche im App Store, Google-Seiten «Wie lange hält …?», die teilbare Bilanz, die Einladung in der WG.

**Albans Woche:** Sonntag 20 Minuten Wochenbericht mit höchstens drei Ja/Nein-Fragen. Dazu höchstens 1 Stunde für das, was nur er kann (posten, eine Mail abschicken).

**Einmalig im Dezember** (rund 6 Stunden, mit Schritt-für-Schritt-Anleitung von Claude):
- Apple-Developer-Konto (USD 99 pro Jahr) und Google-Play-Konto (USD 25 einmal). Google verlangt bei neuen Einzelkonten einen geschlossenen Test mit 12 Personen während 14 Tagen.
- Domain.
- Codemagic-Konto: Die iOS-App wird auf einem Mac gebaut. Codemagic gibt Einzelpersonen 500 Gratis-Minuten pro Monat auf macOS, ohne eigenen Mac.
- Eine Mail-Adresse für Support.
- Eine Stunde Datenschutz-Prüfung durch eine Fachperson vor dem Store-Start.

**Was im Fahrplan deshalb später kommt:**
- Vertrieb mit Terminen (Händler, Gemeinden) erst ab rund 5'000 aktiven Haushalten und mit gemessener Wirkung, und dann zuerst per Mail.
- Social Media nur auf einem Kanal, mit vorbereiteten Beiträgen.

## Ist Cash möglich?

Ja, aber nicht dort, wo man es zuerst sucht.

- **Abos allein tragen in der Schweiz lange nicht.** Wenn 3–4 % für Pro zahlen (CHF 29 pro Jahr, netto rund CHF 22.80), bringen 10'000 Haushalte rund CHF 6'800 pro Jahr und 100'000 Haushalte rund CHF 91'000 pro Jahr (eigene Rechnung).
- **Bezahlte Werbung für Installationen rechnet sich nicht.** Eine Installation bringt bei 3 % Umwandlung und zwei Jahren Abo rund CHF 1.37 (eigene Rechnung). Bezahlte Installationen kosten mehr (Schätzung). Wachstum muss organisch, über die WG und über Partner kommen.
- **Das Geld liegt bei denen, die Food Waste senken müssen:**
  - **Händler:** ein Vorrats-Modul in ihrer App, bezahlt pro aktivem Haushalt; dazu die digitale Quittung mit Einwilligung (P1).
  - **Gemeinden und Kantone:** Programme gegen Food Waste im Haushalt (Aktionsplan Bund, in der EU die Richtlinie 2025/1892 mit −30 % bis 2030), bezahlt pro teilnehmendem Haushalt.
  - **Arbeitgeber:** der Büro-Kühlschrank.
  - **Förderung:** Innosuisse, Klimastiftung Schweiz, Engagement Migros, Coop Fonds für Nachhaltigkeit (Bedingungen prüfen).
- **Der eigentliche Wert für Alban** ist eine messbare Wirkung pro Haushalt plus eine grosse Nutzerbasis. Das macht Rettich für Händler und Food-Tech-Firmen interessant, als Partner oder Käufer.
- **Kosten sind tief, solange alles auf dem Gerät läuft:** App-Stores rund CHF 125 im ersten Jahr (Apple USD 99 pro Jahr, Google USD 25 einmal), Domain, Rechtsprüfung. Serverkosten kommen erst mit «Haushalt teilen».

## Hochrechnung Food-Verlust

Annahme: Rettich senkt den Abfall eines Haushalts um 25 %. Das ist noch nicht gemessen, der Pilot muss es zeigen. Basis: rund CHF 600 und rund 166 kg pro Haushalt und Jahr (WWF 2021; ETH 2019: 663'000 t auf 4.0 Mio. Haushalte, eigene Rechnung).

| Haushalte | gespart pro Jahr | weniger Abfall | Anteil am Haushalts-Food-Waste der Schweiz |
| --- | --- | --- | --- |
| 1'000 | CHF 150'000 | 41 t | 0.01 % |
| 10'000 | CHF 1.5 Mio. | 414 t | 0.06 % |
| 100'000 | CHF 15 Mio. | 4'144 t | 0.6 % |
| 1 Mio. | CHF 150 Mio. | 41'400 t | 6.3 % (1 Mio. Haushalte gibt es nur mit DACH) |

Diese Zahlen sind das Verkaufsargument gegenüber Gemeinden, Händlern und Förderstellen, sobald der Pilot die 25 % (oder eine andere Zahl) belegt.

## Wie Rettich wächst: vier Stufen

| Stufe | Wie | Was es braucht |
| --- | --- | --- |
| **1'000** | Persönlich: WGs und Studierende (HKV Aarau, Hochschulen), Freundeskreis, LinkedIn, Reddit, ein Artikel in der Lokalpresse | App-Stores, eine klare Startseite, Messung im Pilot |
| **10'000** | Die WG bringt die WG: «Haushalt teilen» als Einladung, eine teilbare Monats-Bilanz (Instagram, TikTok), Neujahrsvorsatz «CHF 600 weniger wegwerfen», Partner wie foodwaste.ch oder Pusch, WG-Plattformen | Haushalt teilen (Sync, neuer Datenfluss: Alban entscheidet), Share-Karte, Pro-Abo |
| **100'000** | Partner verteilen: Pilot mit einem Händler (digitale Quittung mit Einwilligung), Programme mit Gemeinden, GS1 Schweiz für 2D-Codes, Österreich als zweiter Markt | Verträge (bis dahin nur Mocks), Datenschutz geprüft, de-AT und EUR |
| **1 Mio.** | Nur mit Verteilung durch einen Grossen: Rettich als Modul in einer Händler-App, oder Deutschland mit Gemeinden und Krankenkassen-Programmen. Organisch in 12 Monaten unrealistisch; Too Good To Go brauchte für 2.6 Mio. Registrierte in der Schweiz mehrere Jahre | Lizenzmodell, Server, Support, Team |

## Fahrplan Dezember 2026 bis November 2027

| Monat | Produkt (Claude baut) | Wachstum und Geld (Alban) | Ziel |
| --- | --- | --- | --- |
| **Dez 2026** | Pilot stabil: Lidl-Fehler, vier Schritte pro Artikel, Messung «Entsorgt pro Monat» | Pilot mit 10–30 Haushalten, Rechtsprüfung (Datenschutz, Laden-Buchstaben, Werbeaussagen), Firmenform, Store-Konten | Wirkung messbar |
| **Jan 2027** | iOS und Android in den Stores, Store-Texte, Startseite | Launch um Neujahr, Presse, Hochschulen | 1'000 |
| **Feb** | Haushalt teilen (WG), Einladung | WG-Plattformen, Studierenden-Organisationen | 2'500 |
| **Mär** | Pro-Abo, teilbare Monats-Bilanz | Förderanträge, erste Gemeinde ansprechen | 5'000 |
| **Apr–Mai** | Katalog auch für Barcode und Suche, Benachrichtigungen | Partner gegen Food Waste, Instagram und TikTok | 10'000 |
| **Jun** | **Entscheid:** Halten Nutzer:innen (Ziel: mindestens 25 % nach 30 Tagen) und sinkt der Abfall messbar? Wenn nein, zuerst das Produkt verbessern, nicht skalieren | Zahlen für Partner aufbereiten | – |
| **Jul–Aug** | Schnittstelle für Händler-Quittungen (Mock bis zum Vertrag), 2D-Codes mit GS1, Österreich vorbereiten (de-AT, EUR, Quittungen von Billa und Spar) | Händler-Pilot verhandeln, Gemeinde-Programm | 30'000 |
| **Sep–Okt** | Launch Österreich, Büro-Kühlschrank | Programme in Österreich (EU-Richtlinie), Arbeitgeber | 60'000 |
| **Nov 2027** | Deutschland vorbereiten (Rewe, Edeka, Aldi, Lidl, dm) | Lizenzmodell mit einem Händler, Finanzierung für Team | 100'000 |

## Woran man misst, ob es läuft

- Aktive Haushalte pro Woche und wie viele nach 7 und 30 Tagen noch da sind.
- CHF «Entsorgt» pro Haushalt und Monat: sinkt die Zahl über die Monate? Das ist der Beleg für alles andere.
- Einladungen pro Haushalt: Wachstum ohne Werbebudget braucht mehr als 0.3 neue Haushalte pro Haushalt (Schätzung).
- Umwandlung zu Pro und Kündigungen.

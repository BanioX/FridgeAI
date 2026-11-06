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

## Was Daten dafür bedeuten

Siehe ADR-0020: Rohdaten so kurz wie möglich aufbewahren. Für Zielgruppen und Werbung reichen Aggregate: Alter grob, Haushaltsgrösse, Kategorien pro Monat. Einzelne Einkäufe braucht es dafür nicht. Kein Verkauf von Einzeldaten (CLAUDE.md).

## Zu klären (Alban)

- Preise und Grenzen zwischen Gratis und Pro.
- Kosten für die App-Stores, falls es eine native App gibt ([`scan-und-produktdaten.md`](./scan-und-produktdaten.md)).
- Rechtliche Prüfung vor der ersten Werbung (Datenschutzerklärung, Einwilligung).
